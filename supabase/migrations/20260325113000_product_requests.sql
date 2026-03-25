-- Solicitações internas de produtos feitas por clientes já aprovados
create table if not exists public.product_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  client_id text not null references public.clients (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_requests_client_id_idx on public.product_requests (client_id);
create index if not exists product_requests_created_at_idx on public.product_requests (created_at desc);

alter table public.product_requests enable row level security;

drop policy if exists "product_requests_dev_all" on public.product_requests;
create policy "product_requests_dev_all" on public.product_requests
  for all to anon, authenticated
  using (true)
  with check (true);

