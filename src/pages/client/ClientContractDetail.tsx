import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockClientes } from "@/data/mockData";
import { toast } from "sonner";

export default function ClientContractDetail() {
  const { id } = useParams();
  const cliente = mockClientes[0];
  const contrato = cliente.contratos.find((c) => c.id === id);

  if (!contrato) {
    return <div className="text-center py-12 text-muted-foreground">Contrato não encontrado.</div>;
  }

  const handleOpenPDF = (status: string) => {
    if (status === "pago") return;
    if (status === "atrasado") {
      toast.warning("Parcela atrasada! O boleto será aberto.");
    }
    window.open("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/cliente">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">Contrato Nº {contrato.numero}</h1>
          <p className="text-sm text-muted-foreground">
            Valor total: R$ {contrato.valor.toFixed(2).replace(".",",")} • {contrato.parcelas} parcelas
          </p>
        </div>
        <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${contrato.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          {contrato.status === "ativo" ? "Ativo" : "Finalizado"}
        </span>
      </div>

      {/* Installments table */}
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
                <tr key={parcela.numero} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-4">
                    <span className="font-medium text-primary">{parcela.numero}/{parcela.total}</span>
                  </td>
                  <td className="px-4 py-4 text-sm">R$ {parcela.valor.toFixed(2).replace(".",",")}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{parcela.vencimento}</td>
                  <td className="px-4 py-4 text-right">
                    {parcela.status === "pago" && (
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-semibold">
                        <Check className="h-4 w-4" /> PAGO
                      </span>
                    )}
                    {parcela.status === "pendente" && (
                      <Button size="sm" onClick={() => handleOpenPDF("pendente")} className="bg-secondary hover:bg-secondary/90">
                        PAGAR
                      </Button>
                    )}
                    {parcela.status === "atrasado" && (
                      <Button size="sm" variant="destructive" onClick={() => handleOpenPDF("atrasado")}>
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
