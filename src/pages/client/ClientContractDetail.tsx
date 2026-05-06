import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, FileText, Barcode, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { getClienteAtualId } from "@/lib/clienteSession";
import type { Parcela } from "@/data/mockData";
import { toast } from "sonner";
import { CONTRACT_STATUS_BADGE_CLASS, CONTRACT_STATUS_LABELS } from "@/lib/contractStatus";

export default function ClientContractDetail() {
  const { id } = useParams();
  const { getClienteById, ready, loading } = useContractsData();
  const cid = getClienteAtualId();
  const cliente = cid ? getClienteById(cid) : undefined;
  const contrato = cliente?.contratos.find((c) => c.id === id);

  const handleOpenBoleto = (parcela: Parcela) => {
    if (parcela.status === "pago") return;
    if (parcela.boletoUrl) {
      window.open(parcela.boletoUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.info(
      "Boleto ainda não disponível. Entre em contato ou aguarde o envio pelo administrador.",
    );
  };

  const copyToClipboard = async (label: string, value: string) => {
    const text = (value ?? "").trim();
    if (!text) {
      toast.info(`${label} ainda não disponível.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado!");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast.success("Copiado!");
      } catch {
        toast.error("Não foi possível copiar.");
      }
    }
  };

  if (!ready || loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Carregando…</div>
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
      <div className="flex items-center gap-3">
        <Link to="/cliente">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">
            Contrato Nº {contrato.numero}
          </h1>
          <p className="text-sm text-muted-foreground">
            Valor total: R$ {contrato.valor.toFixed(2).replace(".", ",")} •{" "}
            {contrato.parcelas} parcelas
          </p>
        </div>
        <span
          className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${CONTRACT_STATUS_BADGE_CLASS[contrato.status]}`}
        >
          {CONTRACT_STATUS_LABELS[contrato.status]}
        </span>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold text-primary flex items-center gap-2">
            <FileText className="h-4 w-4" /> Parcelas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {contrato.listaParcelas.map((parcela) => (
                <tr
                  key={parcela.numero}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-4">
                    <span className="font-medium text-primary">
                      {parcela.numero}/{parcela.total}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    R$ {parcela.valor.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {parcela.vencimento}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {parcela.status === "pago" && (
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-semibold">
                        <Check className="h-4 w-4" /> PAGO
                      </span>
                    )}
                    {parcela.status === "pendente" && (
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => void copyToClipboard("Boleto", parcela.boletoCode ?? "")}
                        >
                          <Barcode className="h-4 w-4" /> Copiar boleto
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="gap-2 bg-secondary hover:bg-secondary/90"
                          onClick={() => void copyToClipboard("Pix", parcela.pixCode ?? "")}
                        >
                          <QrCode className="h-4 w-4" /> Copiar Pix
                        </Button>
                        {!parcela.boletoCode && !parcela.pixCode && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenBoleto(parcela)}
                          >
                            Ver arquivo
                          </Button>
                        )}
                      </div>
                    )}
                    {parcela.status === "atrasado" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenBoleto(parcela)}
                      >
                        ATRASADO
                      </Button>
                    )}
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
