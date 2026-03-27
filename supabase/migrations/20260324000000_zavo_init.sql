-- Zavo: clientes, contratos, parcelas e bucket de boletos
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push
-- Depois crie as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local (veja .env.example).

-- Extensão para gen_random_uuid() (geralmente já habilitada no Supabase)
create extension if not exists "pgcrypto";

-- Tabelas
create table if not exists public.clients (
  id text primary key,
  nome text not null,
  cpf text,
  email text,
  telefone text,
  estado_civil text,
  instagram text,
  contato1 text,
  contato2 text,
  endereco_residencial text,
  endereco_trabalho text,
  salario text,
  dependentes text,
  tipo_moradia text,
  outras_rendas text,
  status_contrato text not null default 'sem_contrato',
  status_manual text not null default 'regular'
);

create table if not exists public.contracts (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  numero text not null,
  valor_total numeric(14, 2) not null,
  parcelas_count int not null,
  valor_parcela numeric(14, 2) not null,
  status text not null check (
    status in (
      'ativo',
      'inativo',
      'aguardando_aprovacao',
      'enviado',
      'aprovado',
      'cancelado',
      'finalizado',
      'parcelas_pendentes'
    )
  ),
  created_at timestamptz not null default now()
);

create index if not exists contracts_client_id_idx on public.contracts (client_id);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null references public.contracts (id) on delete cascade,
  numero int not null,
  valor numeric(14, 2) not null,
  due_date date not null,
  status text not null check (status in ('pago', 'pendente', 'atrasado')),
  boleto_storage_path text,
  unique (contract_id, numero)
);

create index if not exists installments_contract_id_idx on public.installments (contract_id);

-- RLS (políticas permissivas para desenvolvimento — restrinja antes de produção)
alter table public.clients enable row level security;
alter table public.contracts enable row level security;
alter table public.installments enable row level security;

drop policy if exists "zavo_dev_clients_all" on public.clients;
drop policy if exists "zavo_dev_contracts_all" on public.contracts;
drop policy if exists "zavo_dev_installments_all" on public.installments;

create policy "zavo_dev_clients_all" on public.clients
  for all using (true) with check (true);

create policy "zavo_dev_contracts_all" on public.contracts
  for all using (true) with check (true);

create policy "zavo_dev_installments_all" on public.installments
  for all using (true) with check (true);

-- Storage: boletos públicos para leitura direta no front (troque por URLs assinadas em produção)
insert into storage.buckets (id, name, public)
values ('boletos', 'boletos', true)
on conflict (id) do nothing;

drop policy if exists "zavo_boletos_select" on storage.objects;
drop policy if exists "zavo_boletos_insert" on storage.objects;
drop policy if exists "zavo_boletos_update" on storage.objects;
drop policy if exists "zavo_boletos_delete" on storage.objects;

create policy "zavo_boletos_select" on storage.objects
  for select using (bucket_id = 'boletos');

create policy "zavo_boletos_insert" on storage.objects
  for insert with check (bucket_id = 'boletos');

create policy "zavo_boletos_update" on storage.objects
  for update using (bucket_id = 'boletos') with check (bucket_id = 'boletos');

create policy "zavo_boletos_delete" on storage.objects
  for delete using (bucket_id = 'boletos');
