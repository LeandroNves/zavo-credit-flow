import type { Cliente, Contrato } from "@/data/mockData";

export function deriveClienteStatus(contratos: Contrato[]): Cliente["statusContrato"] {
  if (contratos.length === 0) return "sem_contrato";
  if (contratos.every((c) => c.status === "finalizado" || c.status === "cancelado")) return "finalizado";
  if (
    contratos.some((c) =>
      ["ativo", "aprovado", "enviado", "aguardando_aprovacao", "parcelas_pendentes"].includes(c.status),
    )
  ) {
    return "ativo";
  }
  return "em_andamento";
}
