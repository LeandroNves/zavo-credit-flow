import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContractsData } from "@/contexts/ContractsDataContext";

export default function AdminClientDetail() {
  const { id } = useParams();
  const { getClienteById, setClienteSituacao, ready, loading } = useContractsData();
  const cliente = id ? getClienteById(id) : undefined;

  if (!ready || loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando…</div>;
  }

  if (!cliente) return <div className="text-center py-12 text-muted-foreground">Cliente não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-2xl font-bold text-primary">{cliente.nome}</h1>
        <div className="ml-auto w-44">
          <Select value={cliente.situacao} onValueChange={(v) => void setClienteSituacao(cliente.id, v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="irregular">Irregular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card: Dados */}
      <Link to={`/admin/cliente/${cliente.id}/dados`} className="block">
        <div className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Dados do Cliente</h3>
              <p className="text-sm text-muted-foreground">Ver informações completas, documentos e dados financeiros</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Contratos */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Contratos</h2>
        <Link to={`/admin/cliente/${cliente.id}/contrato/novo`}>
          <Button size="sm" className="gap-2" type="button">
            <Plus className="h-4 w-4" /> Novo contrato
          </Button>
        </Link>
      </div>

      {cliente.contratos.length === 0 ? (
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
          Nenhum contrato cadastrado.
        </div>
      ) : (
        <div className="grid gap-4">
          {cliente.contratos.map((contrato) => (
            <div key={contrato.id} className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Contrato {contrato.numero}</h3>
                    <p className="text-sm text-muted-foreground">R$ {contrato.valor.toFixed(2).replace(".",",")} • {contrato.parcelas} parcelas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${contrato.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {contrato.status === "ativo" ? "Ativo" : "Finalizado"}
                  </span>
                  <Link to={`/admin/cliente/${cliente.id}/contrato/${contrato.id}`}>
                    <Button size="sm">Gerenciar</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
