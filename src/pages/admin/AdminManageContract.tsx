import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, FileText } from "lucide-react";
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
import { toast } from "sonner";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_VALUES, type ContractStatus } from "@/lib/contractStatus";
import { ContractProductsEditor } from "@/components/admin/ContractProductsEditor";
import { ContractPaymentLinksEditor } from "@/components/contracts/ContractPaymentLinksEditor";
import { ContratoDetailView } from "@/components/contracts/ContratoDetailView";
import { emptyContractProductFields } from "@/data/mockData";
import type { ContractProductFields } from "@/data/mockData";
import { getContratoProdutos } from "@/lib/contractProducts";
import { buildContratoDocxData } from "@/lib/documentVars";
import {
  downloadGeneratedDocx,
  downloadPromissoriasBatch,
} from "@/lib/generateDocumentClient";
import { buildPromissoriasPaginasData } from "@/lib/promissoriaBatch";
import { contractNumeroForInput } from "@/lib/contractNumero";
import { emptyPaymentLink } from "@/lib/contractPaymentLinks";
import type { ContractPaymentLink } from "@/lib/contractPaymentLinks";

export default function AdminManageContract() {
  const navigate = useNavigate();
  const { id, contratoId } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const [numeroEdit, setNumeroEdit] = useState("");
  const [valorEntradaEdit, setValorEntradaEdit] = useState("");
  const [instituicaoEdit, setInstituicaoEdit] = useState("");
  const [paymentLinksEdit, setPaymentLinksEdit] = useState<ContractPaymentLink[]>([
    emptyPaymentLink(),
  ]);
  const [produtosEdit, setProdutosEdit] = useState<ContractProductFields[]>([
    emptyContractProductFields(),
  ]);
  const [editSaving, setEditSaving] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);

  const {
    getClienteById,
    updateContractStatus,
    updateContractDetails,
    uploadContractDocument,
    deleteContract,
    ready,
    loading,
  } = useContractsData();

  const cliente = id ? getClienteById(id) : undefined;
  const contrato = cliente?.contratos.find((c) => c.id === contratoId);
  const parcelas = contrato?.listaParcelas ?? [];

  const handleContractStatus = async (status: ContractStatus) => {
    if (!id || !contratoId) return;
    await updateContractStatus(id, contratoId, status);
  };

  const openEdit = () => {
    if (!contrato) return;
    setNumeroEdit(contractNumeroForInput(contrato.numero));
    setProdutosEdit(getContratoProdutos(contrato));
    setValorEntradaEdit(
      contrato.valorEntrada != null && contrato.valorEntrada > 0
        ? String(contrato.valorEntrada)
        : "",
    );
    setInstituicaoEdit(contrato.instituicaoFinanceira ?? "");
    const links = contrato.paymentLinks ?? [];
    setPaymentLinksEdit(
      links.length > 0 ? links.map((l) => ({ ...l })) : [emptyPaymentLink()],
    );
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!id || !contratoId || editSaving) return;
    setEditSaving(true);
    try {
      const entrada = parseFloat(valorEntradaEdit.replace(",", ".")) || 0;
      const ok = await updateContractDetails(id, contratoId, {
        numero: numeroEdit,
        produtos: produtosEdit,
        paymentLinks: paymentLinksEdit,
        valorEntrada: entrada > 0 ? entrada : null,
        instituicaoFinanceira: instituicaoEdit,
      });
      if (ok) setEditOpen(false);
    } finally {
      setEditSaving(false);
    }
  };

  const handleGerarContratoWord = async () => {
    if (!cliente || !contrato || generatingDoc) return;
    setGeneratingDoc(true);
    try {
      const vars = buildContratoDocxData(cliente, contrato);
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
    if (!cliente || !contrato || generatingDoc || parcelas.length === 0) return;
    setGeneratingDoc(true);
    try {
      const safeNum = contrato.numero.replace(/[^\w.-]+/g, "_");
      const batchVars = buildPromissoriasPaginasData(cliente, contrato, parcelas);
      await downloadPromissoriasBatch({
        filename: `promissorias-${safeNum}-todas-${parcelas.length}parc.docx`,
        paginas: batchVars.paginas,
      });
      toast.success(
        `Word gerado com ${parcelas.length} promissória(s) em ordem de vencimento.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar promissórias.");
    } finally {
      setGeneratingDoc(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!id || !contratoId) return;
    const ok = await deleteContract(id, contratoId);
    if (ok) navigate(`/admin/cliente/${id}`);
  };

  const handleUploadContract = async (file: File) => {
    if (!id || !contratoId || uploadingContract) return;
    setUploadingContract(true);
    try {
      await uploadContractDocument(id, contratoId, file);
    } finally {
      setUploadingContract(false);
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
    <div className="space-y-4">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar contrato</DialogTitle>
            <DialogDescription>
              Identificação, produtos, resumo financeiro e links de pagamento Asaas.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-entrada">Entrada (R$)</Label>
                <Input
                  id="edit-entrada"
                  inputMode="decimal"
                  value={valorEntradaEdit}
                  onChange={(e) => setValorEntradaEdit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-instituicao">Instituição financeira</Label>
                <Input
                  id="edit-instituicao"
                  value={instituicaoEdit}
                  onChange={(e) => setInstituicaoEdit(e.target.value)}
                />
              </div>
            </div>
            <ContractProductsEditor
              value={produtosEdit}
              onChange={setProdutosEdit}
              idPrefix="edit-prod"
            />
            <ContractPaymentLinksEditor
              value={paymentLinksEdit}
              onChange={setPaymentLinksEdit}
              disabled={editSaving}
              idPrefix="edit-link"
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

      <ContratoDetailView
        contrato={contrato}
        mode="admin"
        backHref={`/admin/cliente/${id}`}
        onUploadContract={handleUploadContract}
        uploadingContract={uploadingContract}
        topBar={
          <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
            <Link to={`/admin/cliente/${id}`}>
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-primary truncate">
                {cliente.nome}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Visão do cliente — administração do contrato
              </p>
            </div>
          </div>
        }
        adminToolbar={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-1" onClick={openEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Editar contrato
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1"
                disabled={generatingDoc}
                onClick={() => void handleGerarContratoWord()}
              >
                <FileText className="h-3.5 w-3.5" />
                {generatingDoc ? "Gerando…" : "Contrato Word"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1"
                disabled={generatingDoc || parcelas.length === 0}
                onClick={() => void handleGerarPromissorias()}
              >
                <FileText className="h-3.5 w-3.5" />
                {generatingDoc ? "Gerando…" : "Promissórias Word"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
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
                        Serão removidos permanentemente o contrato, parcelas, links e
                        documentos associados.
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
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-xs text-muted-foreground shrink-0">Status:</Label>
              <Select
                value={contrato.status}
                onValueChange={(v) => void handleContractStatus(v as ContractStatus)}
              >
                <SelectTrigger className="h-9 w-full sm:w-56">
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
          </div>
        }
      />
    </div>
  );
}
