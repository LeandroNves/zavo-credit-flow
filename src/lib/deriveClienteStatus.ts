import type { Cliente, Contrato } from "@/data/mockData";

export function deriveClienteStatus(contratos: Contrato[]): Cliente["statusContrato"] {
  if (contratos.length === 0) return "sem_contrato";
  if (contratos.every((c) => c.status === "finalizado")) return "finalizado";
  if (contratos.some((c) => c.status === "ativo")) return "ativo";
  return "em_andamento";
}
