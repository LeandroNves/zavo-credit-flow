-- Links de pagamento Asaas (nome + URL) e documento do contrato
alter table public.contracts
  add column if not exists payment_links jsonb not null default '[]'::jsonb,
  add column if not exists contract_document_path text,
  add column if not exists valor_entrada numeric(14, 2),
  add column if not exists instituicao_financeira text;

comment on column public.contracts.payment_links is
  'Lista [{ "label": "Parcelas 1 até 12", "url": "https://..." }] para portal do cliente';
