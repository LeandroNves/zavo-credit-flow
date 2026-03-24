-- Perfis de usuário (cadastro + Auth), documentos e login por nome
-- Recomendado no Supabase: Authentication → Providers → Email → desativar
-- "Confirm email" em desenvolvimento, para o signUp retornar sessão imediata.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null,
  cpf text not null,
  email text not null,
  telefone text not null,
  estado_civil text not null,
  instagram text not null default '',
  contato1 text not null,
  contato2 text not null,
  endereco_residencial text not null,
  endereco_trabalho text not null,
  salario text not null,
  dependentes text not null,
  tipo_moradia text not null,
  outras_rendas text not null default '',
  doc_rg_path text,
  doc_selfie_path text,
  doc_comprovante_path text,
  doc_holerite_path text,
  doc_ctps_path text,
  doc_extrato_path text,
  registration_status text not null default 'pending'
    check (registration_status in ('pending', 'approved', 'rejected')),
  linked_client_id text references public.clients (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on public.profiles (registration_status);
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_dev_select" on public.profiles;
drop policy if exists "profiles_dev_update" on public.profiles;

-- Cadastro: só o próprio usuário autenticado cria a linha com id = auth.uid()
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Usuário vê o próprio perfil
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

-- Painel admin (anon key do app) — modo dev; restrinja com role real depois
create policy "profiles_dev_select" on public.profiles
  for select to anon, authenticated
  using (true);

create policy "profiles_dev_update" on public.profiles
  for update to anon, authenticated
  using (true)
  with check (true);

-- Login com "nome completo": resolve e-mail se for único (homônimos devem usar e-mail)
create or replace function public.lookup_email_for_login(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text;
  at_count int;
  em text;
begin
  trimmed := trim(p_identifier);
  if trimmed is null or length(trimmed) < 2 then
    return null;
  end if;
  if trimmed like '%@%' then
    return trimmed;
  end if;
  select count(*)::int into at_count
  from public.profiles p
  where lower(trim(p.nome_completo)) = lower(trimmed)
    and p.registration_status in ('pending', 'approved');
  if at_count = 0 then
    return null;
  end if;
  if at_count > 1 then
    return '__AMBIGUOUS__';
  end if;
  select p.email into em
  from public.profiles p
  where lower(trim(p.nome_completo)) = lower(trimmed)
    and p.registration_status in ('pending', 'approved')
  limit 1;
  return em;
end;
$$;

revoke all on function public.lookup_email_for_login(text) from public;
grant execute on function public.lookup_email_for_login(text) to anon, authenticated;

-- Bucket documentos de cadastro (público leitura só em dev — use signed URLs em produção)
insert into storage.buckets (id, name, public)
values ('registration-docs', 'registration-docs', true)
on conflict (id) do nothing;

drop policy if exists "reg_docs_insert" on storage.objects;
drop policy if exists "reg_docs_select" on storage.objects;
drop policy if exists "reg_docs_update" on storage.objects;
drop policy if exists "reg_docs_delete" on storage.objects;

create policy "reg_docs_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'registration-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "reg_docs_select" on storage.objects
  for select using (bucket_id = 'registration-docs');

create policy "reg_docs_update" on storage.objects
  for update using (bucket_id = 'registration-docs')
  with check (bucket_id = 'registration-docs');

create policy "reg_docs_delete" on storage.objects
  for delete using (bucket_id = 'registration-docs');
