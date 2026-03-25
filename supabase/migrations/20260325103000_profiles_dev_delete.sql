-- Allow deleting profiles in dev (anon/authenticated)
-- IMPORTANT: Restrinja em produção (use service role / admin role).
drop policy if exists "profiles_dev_delete" on public.profiles;

create policy "profiles_dev_delete" on public.profiles
  for delete to anon, authenticated
  using (true);

