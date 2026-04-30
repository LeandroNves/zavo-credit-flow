ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS delivery_time text NOT NULL DEFAULT '';

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

  DELETE FROM public.landing_products WHERE true;

  INSERT INTO public.landing_products (
    id,
    name,
    color,
    description,
    delivery_time,
    specifications,
    price_cents,
    image_src,
    image_srcs,
    enabled_months,
    created_at,
    updated_at
  )
  SELECT
    NULLIF(trim(elem->>'id'), ''),
    NULLIF(trim(elem->>'name'), ''),
    COALESCE(trim(elem->>'color'), ''),
    COALESCE(trim(elem->>'description'), ''),
    COALESCE(trim(elem->>'delivery_time'), ''),
    CASE
      WHEN jsonb_typeof(elem->'specifications') = 'array' THEN elem->'specifications'
      ELSE '[]'::jsonb
    END,
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
