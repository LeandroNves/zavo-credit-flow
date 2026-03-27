export const CONTRACT_STATUS_VALUES = [
  "ativo",
  "inativo",
  "aguardando_aprovacao",
  "enviado",
  "aprovado",
  "cancelado",
  "finalizado",
  "parcelas_pendentes",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUS_VALUES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  aguardando_aprovacao: "Aguardando aprovação",
  enviado: "Enviado",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
  parcelas_pendentes: "Parcelas pendentes",
};

export const CONTRACT_STATUS_BADGE_CLASS: Record<ContractStatus, string> = {
  ativo: "bg-success/10 text-success",
  inativo: "bg-muted text-muted-foreground",
  aguardando_aprovacao: "bg-warning/10 text-warning",
  enviado: "bg-secondary/10 text-secondary",
  aprovado: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive",
  finalizado: "bg-muted text-muted-foreground",
  parcelas_pendentes: "bg-warning/10 text-warning",
};

export function isContractStatus(value: string): value is ContractStatus {
  return (CONTRACT_STATUS_VALUES as readonly string[]).includes(value);
}

