-- Catálogo global da landing / área cliente.
-- Leitura pública (anon + authenticated); escrita apenas via service_role (API /api/admin/products).

CREATE TABLE IF NOT EXISTS public.landing_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  image_src text NOT NULL DEFAULT '',
  image_srcs jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled_months jsonb NOT NULL DEFAULT '[6, 12, 18, 24]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landing_products_updated_at_idx
  ON public.landing_products (updated_at DESC);

COMMENT ON TABLE public.landing_products IS
  'Produtos exibidos na landing e no portal do cliente; sincronizados pela API admin com service_role.';

GRANT SELECT ON TABLE public.landing_products TO anon, authenticated;

ALTER TABLE public.landing_products ENABLE ROW LEVEL SECURITY;

-- Leitura pública (chave anon do app).
CREATE POLICY "landing_products_select_public"
  ON public.landing_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Sem políticas de INSERT/UPDATE/DELETE para anon/authenticated: mutations só com service_role.

CREATE OR REPLACE FUNCTION public.set_landing_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS landing_products_set_updated_at ON public.landing_products;
CREATE TRIGGER landing_products_set_updated_at
  BEFORE UPDATE ON public.landing_products
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_landing_products_updated_at();

-- Substitui o catálogo inteiro (transação única). Executável apenas pela service_role no backend.
CREATE OR REPLACE FUNCTION public.replace_landing_products(items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF items IS NULL OR jsonb_typeof(items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'replace_landing_products: items deve ser um array JSON';
  END IF;

  IF jsonb_array_length(items) > 200 THEN
    RAISE EXCEPTION 'replace_landing_products: no máximo 200 itens';
  END IF;

  -- pg_safeupdate (comum no Supabase) exige WHERE em DELETE.
  DELETE FROM public.landing_products WHERE true;

  INSERT INTO public.landing_products (
    id, name, color, price_cents, image_src, image_srcs, enabled_months, created_at, updated_at
  )
  SELECT
    NULLIF(trim(elem->>'id'), ''),
    NULLIF(trim(elem->>'name'), ''),
    COALESCE(trim(elem->>'color'), ''),
    GREATEST(0, COALESCE((elem->>'price_cents')::integer, 0)),
    COALESCE(NULLIF(trim(elem->>'image_src'), ''), ''),
    CASE
      WHEN jsonb_typeof(elem->'image_srcs') = 'array' THEN elem->'image_srcs'
      ELSE '[]'::jsonb
    END,
    CASE
      WHEN jsonb_typeof(elem->'enabled_months') = 'array' THEN elem->'enabled_months'
      ELSE '[6, 12, 18, 24]'::jsonb
    END,
    COALESCE((elem->>'created_at')::timestamptz, now()),
    COALESCE((elem->>'updated_at')::timestamptz, now())
  FROM jsonb_array_elements(items) AS t(elem)
  WHERE NULLIF(trim(elem->>'id'), '') IS NOT NULL
    AND NULLIF(trim(elem->>'name'), '') IS NOT NULL
    AND (
      COALESCE(NULLIF(trim(elem->>'image_src'), ''), '') <> ''
      OR (
        jsonb_typeof(elem->'image_srcs') = 'array'
        AND jsonb_array_length(COALESCE(elem->'image_srcs', '[]'::jsonb)) > 0
        AND COALESCE(NULLIF(elem->'image_srcs'->>0, ''), '') <> ''
      )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.replace_landing_products(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_landing_products(jsonb) TO service_role;

-- Realtime: inclui a tabela na publicação padrão do Supabase (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'landing_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_products;
  END IF;
END;
$$;
