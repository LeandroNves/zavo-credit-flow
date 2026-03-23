import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Plus, Upload, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockClientes, type Parcela } from "@/data/mockData";
import { toast } from "sonner";

export default function AdminManageContract() {
  const { id, contratoId } = useParams();
  const cliente = mockClientes.find((c) => c.id === id);
  const contrato = cliente?.contratos.find((c) => c.id === contratoId);

  const [parcelas, setParcelas] = useState<Parcela[]>(contrato?.listaParcelas || []);

  if (!contrato || !cliente) return <div className="text-center py-12 text-muted-foreground">Contrato não encontrado.</div>;

  const handleStatusChange = (idx: number, status: "pago" | "pendente" | "atrasado") => {
    const updated = [...parcelas];
    updated[idx] = { ...updated[idx], status };
    setParcelas(updated);
    toast.success(`Parcela ${idx + 1} atualizada para ${status.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/admin/cliente/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary">Contrato {contrato.numero}</h1>
          <p className="text-sm text-muted-foreground">
            {cliente.nome} • R$ {contrato.valor.toFixed(2).replace(".",",")} • {contrato.parcelas} parcelas
          </p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${contrato.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          {contrato.status === "ativo" ? "Ativo" : "Finalizado"}
        </span>
      </div>

      <div className="flex gap-3">
        <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Criar Parcela</Button>
        <Button size="sm" variant="destructive">Finalizar Contrato</Button>
      </div>

      {/* Parcelas */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p, i) => (
                <tr key={p.numero} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-4 font-medium text-primary">{p.numero}/{p.total}</td>
                  <td className="px-4 py-4 text-sm">R$ {p.valor.toFixed(2).replace(".",",")}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{p.vencimento}</td>
                  <td className="px-4 py-4">
                    <Select value={p.status} onValueChange={(v) => handleStatusChange(i, v as "pago" | "pendente" | "atrasado")}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago">
                          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Pago</span>
                        </SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Upload className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
