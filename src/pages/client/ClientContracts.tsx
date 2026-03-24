import { Link } from "react-router-dom";
import { FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { getClienteAtualId } from "@/lib/clienteSession";

export default function ClientContracts() {
  const { getClienteById, ready, loading } = useContractsData();
  const cliente = getClienteById(getClienteAtualId());

  if (!ready || loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando…</div>;
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cliente não encontrado. Faça login novamente.
      </div>
    );
  }

  const totalParcelas = cliente.contratos.reduce((a, c) => a + c.listaParcelas.length, 0);
  const pagas = cliente.contratos.reduce((a, c) => a + c.listaParcelas.filter(p => p.status === "pago").length, 0);
  const atrasadas = cliente.contratos.reduce((a, c) => a + c.listaParcelas.filter(p => p.status === "atrasado").length, 0);
  const proxima = cliente.contratos.flatMap(c => c.listaParcelas).find(p => p.status === "pendente");
  const progressPct = totalParcelas > 0 ? Math.round((pagas / totalParcelas) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Olá, {cliente.nome.split(" ")[0]}!</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Parcelas Pagas</p>
            <p className="text-xl font-bold text-primary">{pagas}/{totalParcelas}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Próxima Parcela</p>
            <p className="text-xl font-bold text-primary">{proxima ? `R$ ${proxima.valor.toFixed(2).replace(".",",")}` : "—"}</p>
            {proxima && <p className="text-xs text-muted-foreground">Venc: {proxima.vencimento}</p>}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Atrasadas</p>
            <p className="text-xl font-bold text-primary">{atrasadas}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-lg border p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progresso geral</span>
          <span className="font-semibold text-primary">{progressPct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div className="bg-secondary h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Contracts */}
      <h2 className="text-lg font-semibold text-primary">Seus Contratos</h2>
      <div className="grid gap-4">
        {cliente.contratos.map((contrato) => (
          <div key={contrato.id} className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Contrato {contrato.numero}</h3>
                  <p className="text-sm text-muted-foreground">
                    R$ {contrato.valor.toFixed(2).replace(".",",")} • {contrato.parcelas}x de R$ {contrato.valorParcela.toFixed(2).replace(".",",")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${contrato.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {contrato.status === "ativo" ? "Ativo" : "Finalizado"}
                </span>
                <Link to={`/cliente/contrato/${contrato.id}`}>
                  <Button size="sm">Ver Detalhes</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
        {cliente.contratos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum contrato encontrado.</div>
        )}
      </div>
    </div>
  );
}
