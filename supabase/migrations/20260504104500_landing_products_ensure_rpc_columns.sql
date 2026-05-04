-- Correção: RPC replace_landing_products (migração de filtros) insere em description,
-- specifications e delivery_time. Se apenas essa migração foi aplicada no projeto remoto
-- sem as anteriores, essas colunas não existem e o salvamento do admin falha.
-- Este arquivo é idempotente (IF NOT EXISTS).

ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS delivery_time text NOT NULL DEFAULT '';

ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Celular';

ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT 'Apple';

ALTER TABLE public.landing_products
  ADD COLUMN IF NOT EXISTS is_on_sale boolean NOT NULL DEFAULT false;
