import { useParams } from "react-router-dom";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { getClienteAtualId } from "@/lib/clienteSession";
import { ContratoDetailView } from "@/components/contracts/ContratoDetailView";

export default function ClientContractDetail() {
  const { id } = useParams();
  const { getClienteById, ready, loading } = useContractsData();
  const cid = getClienteAtualId();
  const cliente = cid ? getClienteById(cid) : undefined;
  const contrato = cliente?.contratos.find((c) => c.id === id);

  if (!ready || loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Carregando…</div>
    );
  }

  if (!contrato || !cliente) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Contrato não encontrado.
      </div>
    );
  }

  return (
    <ContratoDetailView
      contrato={contrato}
      mode="client"
      backHref="/cliente"
    />
  );
}
