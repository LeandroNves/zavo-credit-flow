import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { ClienteAreaHome } from "@/components/client/ClienteAreaHome";

export default function AdminClientDetail() {
  const { id } = useParams();
  const { getClienteById, setClienteSituacao, ready, loading } = useContractsData();
  const cliente = id ? getClienteById(id) : undefined;

  if (!ready || loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Carregando…</div>
    );
  }

  if (!cliente || !id) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Cliente não encontrado.
      </div>
    );
  }

  return (
    <ClienteAreaHome
      cliente={cliente}
      showClientGreeting={false}
      contractHref={(contratoId) => `/admin/cliente/${id}/contrato/${contratoId}`}
      contractActionLabel="Gerenciar contrato"
      dadosHref={`/admin/cliente/${id}/dados`}
      produtosHref="/admin/produtos"
      topBar={
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <Link to="/admin">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">Visão do cliente</p>
            <p className="truncate font-semibold text-primary">{cliente.nome}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={cliente.situacao}
              onValueChange={(v) => void setClienteSituacao(cliente.id, v as "regular" | "irregular")}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="irregular">Irregular</SelectItem>
              </SelectContent>
            </Select>
            <Link to={`/admin/cliente/${id}/dados`}>
              <Button type="button" variant="outline" size="sm" className="gap-1">
                <User className="h-4 w-4" />
                Dados
              </Button>
            </Link>
          </div>
        </div>
      }
      contractsExtra={
        <Link to={`/admin/cliente/${id}/contrato/novo`}>
          <Button size="sm" className="gap-1 w-full sm:w-auto" type="button">
            <Plus className="h-4 w-4" />
            Novo contrato
          </Button>
        </Link>
      }
    />
  );
}
