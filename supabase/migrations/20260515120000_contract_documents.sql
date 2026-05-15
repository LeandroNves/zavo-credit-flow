-- Campos do comprador (documentos) e produto vinculado ao contrato
alter table public.clients
  add column if not exists rg text,
  add column if not exists profissao text,
  add column if not exists data_nascimento text;

alter table public.contracts
  add column if not exists produto_categoria text,
  add column if not exists produto_modelo text,
  add column if not exists produto_cor text,
  add column if not exists produto_serie text,
  add column if not exists produto_imei text,
  add column if not exists produto_estado text,
  add column if not exists produto_acessorios text;
