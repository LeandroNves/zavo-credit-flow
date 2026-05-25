-- Vários produtos por contrato (array JSON); colunas produto_* mantidas como 1º item (compatibilidade).
alter table public.contracts
  add column if not exists produtos jsonb not null default '[]'::jsonb;

comment on column public.contracts.produtos is
  'Lista de produtos vendidos: [{ produtoCategoria, produtoModelo, produtoCor, produtoSerie, produtoImei, produtoImei2?, produtoEstado, produtoAcessorios }]';
