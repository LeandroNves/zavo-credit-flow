import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Pencil, Trash2, Barcode, QrCode, FileText, Download } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useContractsData } from "@/contexts/ContractsDataContext";
import type { Parcela } from "@/data/mockData";
import { toast } from "sonner";
import { CONTRACT_STATUS_BADGE_CLASS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_VALUES, type ContractStatus } from "@/lib/contractStatus";
import { brVencimentoToDateInputValue } from "@/lib/parcelSchedule";
import { ContractProductFieldsForm } from "@/components/admin/ContractProductFieldsForm";
import { emptyContractProductFields } from "@/data/mockData";
import type { ContractProductFields } from "@/data/mockData";
import {
  buildContratoDocumentVars,
  buildPromissoriaDocumentVars,
} from "@/lib/documentVars";
import {
  downloadGeneratedDocx,
  downloadGeneratedPdf,
  downloadGeneratedZip,
} from "@/lib/generateDocumentClient";
import { contractNumeroForInput } from "@/lib/contractNumero";

export default function AdminManageContract() {
  const navigate = useNavigate();
  const { id, contratoId } = useParams();
  const [payCodeOpen, setPayCodeOpen] = useState(false);
  const [payCodeParcela, setPayCodeParcela] = useState<Parcela | null>(null);
  const [boletoCode, setBoletoCode] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [numeroEdit, setNumeroEdit] = useState("");
  const [produtoEdit, setProdutoEdit] = useState<ContractProductFields>(
    emptyContractProductFields(),
  );
  const [editSaving, setEditSaving] = useState(false);
  const [promissoriaOpen, setPromissoriaOpen] = useState(false);
  const [promissoriaMode, setPromissoriaMode] = useState<"uma" | "todas">("uma");
  const [promissoriaFormat, setPromissoriaFormat] = useState<"pdf" | "docx">("pdf");
  const [promissoriaParcela, setPromissoriaParcela] = useState("1");
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [parcelaEdit, setParcelaEdit] = useState<Parcela | null>(null);
  const [parcelaValorStr, setParcelaValorStr] = useState("");
  const [parcelaDueIso, setParcelaDueIso] = useState("");
  const [parcelaSaving, setParcelaSaving] = useState(false);

  const {
    getClienteById,
    updateParcelaStatus,
    updateParcelaValorVencimento,
    updateParcelaPaymentCodes,
    updateContractStatus,
    updateContractDetails,
    deleteContract,
    ready,
    loading,
  } = useContractsData();

  const cliente = id ? getClienteById(id) : undefined;
  const contrato = cliente?.contratos.find((c) => c.id === contratoId);
  const parcelas = contrato?.listaParcelas ?? [];

  useEffect(() => {
    if (!parcelaEdit) return;
    setParcelaValorStr(String(parcelaEdit.valor));
    setParcelaDueIso(brVencimentoToDateInputValue(parcelaEdit.vencimento));
  }, [parcelaEdit]);

  useEffect(() => {
    if (!payCodeOpen || !payCodeParcela) return;
    setBoletoCode(payCodeParcela.boletoCode ?? "");
    setPixCode(payCodeParcela.pixCode ?? "");
  }, [payCodeOpen, payCodeParcela]);

  const handleStatusChange = async (
    parcelaNumero: number,
    status: Parcela["status"],
  ) => {
    if (!id || !contratoId) return;
    await updateParcelaStatus(id, contratoId, parcelaNumero, status);
    toast.success(`Parcela ${parcelaNumero} atualizada para ${status.toUpperCase()}.`);
  };

  const handleContractStatus = async (status: ContractStatus) => {
    if (!id || !contratoId) return;
    await updateContractStatus(id, contratoId, status);
  };

  const openEdit = () => {
    if (!contrato) return;
    setNumeroEdit(contractNumeroForInput(contrato.numero));
    setProdutoEdit({
      produtoCategoria: contrato.produtoCategoria,
      produtoModelo: contrato.produtoModelo,
      produtoCor: contrato.produtoCor,
      produtoSerie: contrato.produtoSerie,
      produtoImei: contrato.produtoImei,
      produtoEstado: contrato.produtoEstado,
      produtoAcessorios: contrato.produtoAcessorios,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!id || !contratoId || editSaving) return;
    setEditSaving(true);
    try {
      const ok = await updateContractDetails(id, contratoId, {
        numero: numeroEdit,
        ...produtoEdit,
      });
      if (ok) setEditOpen(false);
    } finally {
      setEditSaving(false);
    }
  };

  const handleGerarContratoPdf = async () => {
    if (!cliente || !contrato || generatingDoc) return;
    setGeneratingDoc(true);
    try {
      const vars = buildContratoDocumentVars(cliente, contrato);
      const safeNum = contrato.numero.replace(/[^\w.-]+/g, "_");
      await downloadGeneratedPdf({
        template: "contrato",
        filename: `contrato-${safeNum}.pdf`,
        vars,
      });
      toast.success("Contrato PDF gerado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar contrato PDF.");
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleGerarContratoWord = async () => {
    if (!cliente || !contrato || generatingDoc) return;
    setGeneratingDoc(true);
    try {
      const vars = buildContratoDocumentVars(cliente, contrato);
      const safeNum = contrato.numero.replace(/[^\w.-]+/g, "_");
      await downloadGeneratedDocx({
        template: "contrato",
        filename: `contrato-${safeNum}.docx`,
        vars,
      });
      toast.success("Contrato Word gerado (formatação completa).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar contrato Word.");
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleGerarPromissorias = async () => {
    if (!cliente || !contrato || generatingDoc) return;
    setGeneratingDoc(true);
    try {
      const safeNum = contrato.numero.replace(/[^\w.-]+/g, "_");
      const ext = promissoriaFormat === "docx" ? "docx" : "pdf";
      if (promissoriaMode === "todas") {
        const entries = parcelas.map((p) => ({
          filename: `promissoria-${safeNum}-parc-${p.numero}.${ext}`,
          vars: buildPromissoriaDocumentVars(cliente, contrato, p),
        }));
        await downloadGeneratedZip({
          template: "promissoria",
          format: promissoriaFormat,
          zipFilename: `promissorias-${safeNum}.zip`,
          entries,
        });
        toast.success("ZIP de promissórias gerado.");
      } else {
        const n = parseInt(promissoriaParcela, 10);
        const p = parcelas.find((x) => x.numero === n);
        if (!p) {
          toast.error("Parcela não encontrada.");
          return;
        }
        if (promissoriaFormat === "docx") {
          await downloadGeneratedDocx({
            template: "promissoria",
            filename: `promissoria-${safeNum}-parc-${p.numero}.docx`,
            vars: buildPromissoriaDocumentVars(cliente, contrato, p),
          });
        } else {
          await downloadGeneratedPdf({
            template: "promissoria",
            filename: `promissoria-${safeNum}-parc-${p.numero}.pdf`,
            vars: buildPromissoriaDocumentVars(cliente, contrato, p),
          });
        }
        toast.success("Promissória gerada.");
      }
      setPromissoriaOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar promissória.");
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!id || !contratoId) return;
    const ok = await deleteContract(id, contratoId);
    if (ok) navigate(`/admin/cliente/${id}`);
  };

  const contractLocked =
    contrato?.status === "finalizado" || contrato?.status === "cancelado";

  const handleSaveParcelaEdit = async () => {
    if (!id || !contratoId || !parcelaEdit || parcelaSaving) return;
    const normalized = parcelaValorStr.replace(",", ".").trim();
    const valor = Math.round(parseFloat(normalized) * 100) / 100;
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parcelaDueIso)) {
      toast.error("Selecione uma data de vencimento válida.");
      return;
    }
    setParcelaSaving(true);
    try {
      const ok = await updateParcelaValorVencimento(
        id,
        contratoId,
        parcelaEdit.numero,
        { valor, dueDateIso: parcelaDueIso },
      );
      if (ok) setParcelaEdit(null);
    } finally {
      setParcelaSaving(false);
    }
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
      <Dialog
        open={payCodeOpen}
        onOpenChange={(open) => {
          setPayCodeOpen(open);
          if (!open) setPayCodeParcela(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Códigos de pagamento {payCodeParcela ? `— Parcela ${payCodeParcela.numero}/${payCodeParcela.total}` : ""}
            </DialogTitle>
            <DialogDescription>
              Cole a linha digitável do boleto e/ou o código Pix “copia e cola”. O cliente terá um botão para copiar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="boleto-code">Código do boleto</Label>
              <Textarea
                id="boleto-code"
                value={boletoCode}
                onChange={(e) => setBoletoCode(e.target.value)}
                placeholder="Cole aqui a linha digitável do boleto"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix-code">Código Pix</Label>
              <Textarea
                id="pix-code"
                value={pixCode}
                onChange={(e) => setPixCode(e.target.value)}
                placeholder="Cole aqui o código Pix (copia e cola)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPayCodeOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!id || !contratoId || !payCodeParcela) return;
                void updateParcelaPaymentCodes(id, contratoId, payCodeParcela.numero, {
                  boletoCode,
                  pixCode,
                }).then(() => setPayCodeOpen(false));
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={parcelaEdit != null}
        onOpenChange={(open) => {
          if (!open) setParcelaEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar parcela {parcelaEdit ? `${parcelaEdit.numero}/${parcelaEdit.total}` : ""}
            </DialogTitle>
            <DialogDescription>
              Altere o valor (ex.: juros/multa) e a data de vencimento. O valor total do
              contrato passa a ser a soma de todas as parcelas; as demais parcelas não
              mudam até você editá-las.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="parc-valor">Valor da parcela (R$)</Label>
              <Input
                id="parc-valor"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={parcelaValorStr}
                onChange={(e) => setParcelaValorStr(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parc-due">Vencimento</Label>
              <Input
                id="parc-due"
                type="date"
                value={parcelaDueIso}
                onChange={(e) => setParcelaDueIso(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={parcelaSaving}
              onClick={() => setParcelaEdit(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={parcelaSaving}
              onClick={() => void handleSaveParcelaEdit()}
            >
              {parcelaSaving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar contrato</DialogTitle>
            <DialogDescription>
              Identificação e dados do produto para geração de PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-numero">Identificação do contrato</Label>
              <Input
                id="edit-numero"
                value={numeroEdit}
                onChange={(e) => setNumeroEdit(e.target.value)}
                placeholder="395-2025"
                autoComplete="off"
              />
            </div>
            <ContractProductFieldsForm
              value={produtoEdit}
              onChange={setProdutoEdit}
              idPrefix="edit-prod"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={editSaving} onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={editSaving} onClick={() => void handleEditSave()}>
              {editSaving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promissoriaOpen} onOpenChange={setPromissoriaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar promissórias</DialogTitle>
            <DialogDescription>
              Word mantém o layout do modelo; PDF fiel exige Gotenberg na Vercel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select
                value={promissoriaFormat}
                onValueChange={(v) => setPromissoriaFormat(v as "pdf" | "docx")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opção</Label>
              <Select value={promissoriaMode} onValueChange={(v) => setPromissoriaMode(v as "uma" | "todas")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uma">Uma parcela</SelectItem>
                  <SelectItem value="todas">Todas (ZIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {promissoriaMode === "uma" && (
              <div className="space-y-2">
                <Label>Parcela</Label>
                <Select value={promissoriaParcela} onValueChange={setPromissoriaParcela}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {parcelas.map((p) => (
                      <SelectItem key={p.numero} value={String(p.numero)}>
                        {p.numero}/{p.total} — {p.vencimento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPromissoriaOpen(false)}>Cancelar</Button>
            <Button type="button" disabled={generatingDoc} onClick={() => void handleGerarPromissorias()}>
              {generatingDoc ? "Gerando…" : "Baixar"}
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
              onClick={openEdit}
            >
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {cliente.nome} • Total R$ {contrato.valor.toFixed(2).replace(".", ",")} •{" "}
            {contrato.parcelas} parcelas (soma das parcelas)
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${CONTRACT_STATUS_BADGE_CLASS[contrato.status]}`}>
            {CONTRACT_STATUS_LABELS[contrato.status]}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1"
            disabled={generatingDoc}
            onClick={() => void handleGerarContratoWord()}
          >
            <FileText className="h-3 w-3" />
            Contrato Word
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={generatingDoc}
            onClick={() => void handleGerarContratoPdf()}
          >
            <Download className="h-3 w-3" />
            Contrato PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={generatingDoc || parcelas.length === 0}
            onClick={() => setPromissoriaOpen(true)}
          >
            <Download className="h-3 w-3" />
            Promissórias
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="w-64">
          <Select value={contrato.status} onValueChange={(v) => void handleContractStatus(v as ContractStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTRACT_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTRACT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir contrato
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este contrato para sempre?</AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-3">
                <span className="block font-medium text-destructive">
                  Esta ação não pode ser desfeita pelo painel.
                </span>
                <span className="block text-foreground">
                  Serão removidos permanentemente: todas as{" "}
                  <strong>parcelas</strong>, histórico de status, referências no
                  cadastro do cliente e os <strong>arquivos de boleto</strong>{" "}
                  associados (quando aplicável).
                </span>
                <span className="block">
                  Confirme apenas se tiver certeza de que este contrato e seus
                  dados devem sumir da base e da área do cliente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => void handleDeleteContract()}
              >
                Sim, excluir permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                <th className="px-4 py-3 font-medium">Pagamento</th>
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
                      disabled={contractLocked}
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
                  <td className="px-4 py-4 text-xs text-muted-foreground max-w-[180px] truncate">
                    {p.boletoCode || p.pixCode ? "Código salvo" : p.boletoUrl ? "Arquivo (legado)" : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={contractLocked}
                      onClick={() => {
                        setPayCodeParcela(p);
                        setPayCodeOpen(true);
                      }}
                    >
                      <Barcode className="h-3 w-3" />
                      Códigos
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1 ml-2"
                      disabled={contractLocked}
                      onClick={() => setParcelaEdit(p)}
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
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
