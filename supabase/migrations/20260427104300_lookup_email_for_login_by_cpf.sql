-- Login: resolve e-mail via CPF ou e-mail
-- Mantém o nome da função para não quebrar o frontend, mas muda a regra:
-- - Se vier e-mail (contém @): retorna o próprio valor
-- - Se vier CPF (apenas dígitos ou com máscara): busca em public.profiles.cpf (normalizado)

create or replace function public.lookup_email_for_login(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text;
  digits text;
  em text;
begin
  trimmed := trim(p_identifier);
  if trimmed is null or length(trimmed) < 3 then
    return null;
  end if;

  if trimmed like '%@%' then
    return lower(trimmed);
  end if;

  digits := regexp_replace(trimmed, '\D', '', 'g');
  if length(digits) <> 11 then
    return null;
  end if;

  select p.email into em
  from public.profiles p
  where regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = digits
    and p.registration_status in ('pending', 'approved')
  limit 1;

  return em;
end;
$$;

revoke all on function public.lookup_email_for_login(text) from public;
grant execute on function public.lookup_email_for_login(text) to anon, authenticated;

