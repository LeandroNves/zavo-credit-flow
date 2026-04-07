import { User } from "lucide-react";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { getClienteAtualId } from "@/lib/clienteSession";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function ClientPersonalData() {
  const { getClienteById, ready, loading } = useContractsData();
  const cid = getClienteAtualId();
  const cliente = cid ? getClienteById(cid) : undefined;

  if (!ready || loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando…</div>;
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cliente não encontrado.
      </div>
    );
  }

  const situacaoLabel =
    cliente.situacao === "irregular" ? "Irregular" : "Regular";
  const situacaoDesc =
    cliente.situacao === "irregular"
      ? "Sua situação foi marcada como irregular pela equipe. Entre em contato se tiver dúvidas."
      : "Sua situação está regular junto à equipe.";

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-primary">Dados Pessoais</h1>
      <p className="text-sm text-muted-foreground">
        Por privacidade, estes dados aparecem para você. 
      </p>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2">
          <User className="h-5 w-5" /> Seus dados
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo" value={cliente.nome} />
          <Field label="CPF" value={cliente.cpf} />
          <Field label="E-mail" value={cliente.email} />
          <Field label="Telefone" value={cliente.telefone} />
          <div className="sm:col-span-2">
            <Field label="Situação" value={situacaoLabel} />
            <p className="text-xs text-muted-foreground mt-1.5">{situacaoDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
