-- Expande os status possíveis de contrato para controle manual no painel
alter table public.contracts
  drop constraint if exists contracts_status_check;

alter table public.contracts
  add constraint contracts_status_check
  check (
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
  );

