ALTER TABLE public.installments
  ADD COLUMN IF NOT EXISTS boleto_code text,
  ADD COLUMN IF NOT EXISTS pix_code text;

