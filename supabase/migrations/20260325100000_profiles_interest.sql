-- Add interest type + selected products snapshot to profiles
alter table public.profiles
  add column if not exists interest_type text not null default 'emprestimo'
    check (interest_type in ('emprestimo', 'produto', 'ambos'));

alter table public.profiles
  add column if not exists interest_cart jsonb;

