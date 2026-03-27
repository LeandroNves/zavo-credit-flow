-- Rate limit para tentativas de login no painel admin (API serverless com service role).
-- Anon/authenticated não têm políticas; apenas a chave service_role usada no servidor acessa.

CREATE TABLE IF NOT EXISTS public.admin_login_rate (
  ip_hash text PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);

ALTER TABLE public.admin_login_rate ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.admin_login_rate IS 'Contador de falhas de login admin por IP (hash); uso exclusivo server-side.';
