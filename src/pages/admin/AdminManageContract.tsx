import { useParams, Link } from "react-router-dom";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useContractsData } from "@/contexts/ContractsDataContext";
import type { Parcela } from "@/data/mockData";
import { toast } from "sonner";

export default function AdminManageContract() {
  const { id, contratoId } = useParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadParcelaNum, setUploadParcelaNum] = useState<number | null>(null);

  const {
    getClienteById,
    updateParcelaStatus,
    uploadParcelaBoleto,
    finalizeContract,
    ready,
    loading,
  } = useContractsData();

  const cliente = id ? getClienteById(id) : undefined;
  const contrato = cliente?.contratos.find((c) => c.id === contratoId);
  const parcelas = contrato?.listaParcelas ?? [];

  const openFilePicker = (parcelaNumero: number) => {
    setUploadParcelaNum(parcelaNumero);
    requestAnimationFrame(() => fileRef.current?.click());
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !id || !contratoId || uploadParcelaNum == null || !cliente) {
      setUploadParcelaNum(null);
      return;
    }
    await uploadParcelaBoleto(id, contratoId, uploadParcelaNum, file);
    setUploadParcelaNum(null);
  };

  const handleStatusChange = async (
    parcelaNumero: number,
    status: Parcela["status"],
  ) => {
    if (!id || !contratoId) return;
    await updateParcelaStatus(id, contratoId, parcelaNumero, status);
    toast.success(`Parcela ${parcelaNumero} atualizada para ${status.toUpperCase()}.`);
  };

  const handleFinalize = async () => {
    if (!id || !contratoId) return;
    await finalizeContract(id, contratoId);
  };

  if (!ready || loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando…
      </div>
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
    <div className="space-y-6">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,image/*"
        onChange={onFileChange}
      />

      <div className="flex items-center gap-3">
        <Link to={`/admin/cliente/${id}`}>
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary">
            Contrato {contrato.numero}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cliente.nome} • R$ {contrato.valor.toFixed(2).replace(".", ",")} •{" "}
            {contrato.parcelas} parcelas
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${contrato.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
        >
          {contrato.status === "ativo" ? "Ativo" : "Finalizado"}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {contrato.status === "ativo" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" type="button">
                Finalizar contrato
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar contrato?</AlertDialogTitle>
                <AlertDialogDescription>
                  O contrato passará ao status finalizado. Esta ação pode ser
                  revisada apenas pelo suporte ao banco de dados, se necessário.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction type="button" onClick={handleFinalize}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Boleto</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr
                  key={p.numero}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-4 font-medium text-primary">
                    {p.numero}/{p.total}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    R$ {p.valor.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {p.vencimento}
                  </td>
                  <td className="px-4 py-4">
                    <Select
                      value={p.status}
                      onValueChange={(v) =>
                        handleStatusChange(p.numero, v as Parcela["status"])
                      }
                      disabled={contrato.status === "finalizado"}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago">
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-success" /> Pago
                          </span>
                        </SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[140px] truncate">
                    {p.boletoUrl ? "Anexado" : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={contrato.status === "finalizado"}
                      onClick={() => openFilePicker(p.numero)}
                    >
                      <Upload className="h-3 w-3" />
                      Enviar boleto
                    </Button>
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
