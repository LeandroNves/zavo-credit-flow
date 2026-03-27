import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContractsData } from "@/contexts/ContractsDataContext";

const statusLabels: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success" },
  em_andamento: { label: "Em andamento", color: "bg-warning/10 text-warning" },
  sem_contrato: { label: "Sem contrato", color: "bg-destructive/10 text-destructive" },
  finalizado: { label: "Finalizado", color: "bg-muted text-muted-foreground" },
};

export default function AdminClients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "sem_contrato" | "finalizado">("todos");
  const { clientes, ready, loading } = useContractsData();
  const filtered = clientes.filter((c) => {
    const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === "todos") return true;
    if (statusFilter === "ativo") return c.statusContrato === "ativo" || c.statusContrato === "em_andamento";
    return c.statusContrato === statusFilter;
  });

  if (!ready || loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando clientes…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">Gestão de Clientes</h1>
        <Button className="gap-2" asChild>
          <Link to="/admin/cliente/novo">
            <Plus className="h-4 w-4" /> Criar cliente
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-w-xs">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="sem_contrato">Sem contrato</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = statusLabels[c.statusContrato];
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-4 font-medium text-primary">{c.nome}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{c.cpf}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/admin/cliente/${c.id}`}>
                        <Button size="sm" variant="outline">Ver</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
