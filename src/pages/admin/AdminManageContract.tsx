import { useParams, Link } from "react-router-dom";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Pencil, Upload } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { contractNumeroForInput } from "@/lib/contractNumero";
import type { Parcela } from "@/data/mockData";
import { toast } from "sonner";

export default function AdminManageContract() {
  const { id, contratoId } = useParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadParcelaNum, setUploadParcelaNum] = useState<number | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [numeroEdit, setNumeroEdit] = useState("");

  const {
    getClienteById,
    updateParcelaStatus,
    uploadParcelaBoleto,
    finalizeContract,
    renameContractNumero,
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

  const openRename = () => {
    if (contrato) setNumeroEdit(contractNumeroForInput(contrato.numero));
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    if (!id || !contratoId) return;
    const ok = await renameContractNumero(id, contratoId, numeroEdit);
    if (ok) setRenameOpen(false);
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

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Identificação do contrato</DialogTitle>
            <DialogDescription>
              Ex.: 395-2025 — o símbolo # é acrescentado automaticamente se faltar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rename-numero">Nome / número do contrato</Label>
            <Input
              id="rename-numero"
              value={numeroEdit}
              onChange={(e) => setNumeroEdit(e.target.value)}
              placeholder="395-2025"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleRenameSave()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-3">
        <Link to={`/admin/cliente/${id}`}>
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-primary truncate">
              Contrato {contrato.numero}
            </h1>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1 shrink-0"
              onClick={openRename}
            >
              <Pencil className="h-3 w-3" />
              Renomear
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {cliente.nome} • R$ {contrato.valor.toFixed(2).replace(".", ",")} •{" "}
            {contrato.parcelas} parcelas
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${contrato.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
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
