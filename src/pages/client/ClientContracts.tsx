import { useContractsData } from "@/contexts/ContractsDataContext";
import { getClienteAtualId } from "@/lib/clienteSession";
import { ClienteAreaHome } from "@/components/client/ClienteAreaHome";

export default function ClientContracts() {
  const { getClienteById, ready, loading } = useContractsData();
  const cid = getClienteAtualId();
  const cliente = cid ? getClienteById(cid) : undefined;

  if (!ready || loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Carregando…</div>
    );
  }

  if (!cliente) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Cliente não encontrado. Faça login novamente.
      </div>
    );
  }

  return (
    <ClienteAreaHome
      cliente={cliente}
      contractHref={(id) => `/cliente/contrato/${id}`}
      contractActionLabel="Ver detalhes do contrato"
    />
  );
}
