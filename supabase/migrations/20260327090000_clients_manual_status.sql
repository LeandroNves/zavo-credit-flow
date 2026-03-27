-- Adds manual status for admin control (regular/irregular)
alter table public.clients
  add column if not exists status_manual text not null default 'regular';

