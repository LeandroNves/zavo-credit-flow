import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_VALUES, type ContractStatus } from "@/lib/contractStatus";
import {
  buildParcelaDueDates,
  formatVencimentoBR,
  splitTotalAcrossInstallments,
} from "@/lib/parcelSchedule";
import { ContractProductsEditor } from "@/components/admin/ContractProductsEditor";
import { ContractPaymentLinksEditor } from "@/components/contracts/ContractPaymentLinksEditor";
import { emptyContractProductFields } from "@/data/mockData";
import type { ContractProductFields } from "@/data/mockData";
import { emptyPaymentLink } from "@/lib/contractPaymentLinks";
import type { ContractPaymentLink } from "@/lib/contractPaymentLinks";

export default function AdminCreateContract() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getClienteById,
    createContractForCliente,
    ready,
    loading,
  } = useContractsData();

  const cliente = id ? getClienteById(id) : undefined;

  const [numeroContrato, setNumeroContrato] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [valorEntrada, setValorEntrada] = useState("");
  const [instituicaoFinanceira, setInstituicaoFinanceira] = useState("");
  const [qtdParcelas, setQtdParcelas] = useState("12");
  const [statusContrato, setStatusContrato] = useState<ContractStatus>("ativo");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [vencimentosOverrideIso, setVencimentosOverrideIso] = useState<string[]>([]);
  const [primeiroMes, setPrimeiroMes] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );
  const [paymentLinks, setPaymentLinks] = useState<ContractPaymentLink[]>([
    emptyPaymentLink(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [produtos, setProdutos] = useState<ContractProductFields[]>([
    emptyContractProductFields(),
  ]);

  const nParcelas = Math.max(1, parseInt(qtdParcelas, 10) || 1);
  const dia = Math.min(31, Math.max(1, parseInt(diaVencimento, 10) || 10));
  const valorNum = parseFloat(valorTotal.replace(",", ".")) || 0;
  const entradaNum = parseFloat(valorEntrada.replace(",", ".")) || 0;

  useEffect(() => {
    setVencimentosOverrideIso((prev) => {
      const next = prev.slice(0, nParcelas);
      while (next.length < nParcelas) next.push("");
      return next;
    });
  }, [nParcelas]);

  const preview = useMemo(() => {
    if (valorNum <= 0 || nParcelas < 1) return [];
    const valores = splitTotalAcrossInstallments(valorNum, nParcelas);
    const dates = buildParcelaDueDates(primeiroMes, nParcelas, dia);
    return dates.map((d, i) => ({
      n: i + 1,
      vencimento: formatVencimentoBR(d),
      vencimentoIso: format(d, "yyyy-MM-dd"),
      valor: valores[i],
    }));
  }, [valorNum, nParcelas, primeiroMes, dia]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !cliente || submitting) return;
    if (valorNum <= 0) return;
    setSubmitting(true);
    try {
      await createContractForCliente(id, {
        numeroPersonalizado: numeroContrato,
        valorTotal: valorNum,
        parcelasCount: nParcelas,
        status: statusContrato,
        diaVencimento: dia,
        primeiroVencimentoYm: primeiroMes,
        vencimentosPorParcelaIso: vencimentosOverrideIso.slice(0, nParcelas),
        produtos,
        paymentLinks,
        valorEntrada: entradaNum > 0 ? entradaNum : null,
        instituicaoFinanceira,
      });
      navigate(`/admin/cliente/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando dados…
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cliente não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to={`/admin/cliente/${id}`}>
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Novo contrato</h1>
          <p className="text-sm text-muted-foreground">{cliente.nome}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Condições do crédito</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="numero-contrato">Identificação do contrato</Label>
              <Input
                id="numero-contrato"
                placeholder="Ex.: 395-2025 (o # será adicionado se necessário)"
                value={numeroContrato}
                onChange={(e) => setNumeroContrato(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Opcional: se deixar em branco, um código é gerado automaticamente.
                Não pode repetir outro contrato deste mesmo cliente.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor total do crédito (R$)</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="Ex: 5000,00"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entrada">Entrada (R$)</Label>
              <Input
                id="entrada"
                inputMode="decimal"
                placeholder="Opcional"
                value={valorEntrada}
                onChange={(e) => setValorEntrada(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="instituicao">Instituição financeira</Label>
              <Input
                id="instituicao"
                placeholder="Ex.: Banco do Brasil"
                value={instituicaoFinanceira}
                onChange={(e) => setInstituicaoFinanceira(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parcelas">Número de parcelas</Label>
              <Input
                id="parcelas"
                type="number"
                min={1}
                max={120}
                value={qtdParcelas}
                onChange={(e) => setQtdParcelas(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status do contrato</Label>
              <Select value={statusContrato} onValueChange={(v) => setStatusContrato(v as ContractStatus)}>
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
            <div className="space-y-2">
              <Label htmlFor="dia">Dia de vencimento (todo mês)</Label>
              <Input
                id="dia"
                type="number"
                min={1}
                max={31}
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mes">Mês da 1ª parcela</Label>
              <Input
                id="mes"
                type="month"
                value={primeiroMes}
                onChange={(e) => setPrimeiroMes(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            As parcelas serão geradas em meses consecutivos, no dia escolhido
            (ajustado ao último dia do mês quando necessário). Os links do Asaas
            substituem o envio de boletos por parcela.
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Produtos vendidos</h2>
          <p className="text-sm text-muted-foreground">
            Inclua todos os itens desta venda. Os dados entram no contrato Word e
            na área do cliente.
          </p>
          <ContractProductsEditor
            value={produtos}
            onChange={setProdutos}
            idPrefix="novo-prod"
          />
        </div>

        <div className="bg-card rounded-lg border p-6">
          <ContractPaymentLinksEditor
            value={paymentLinks}
            onChange={setPaymentLinks}
            disabled={submitting}
            idPrefix="novo-link"
          />
        </div>

        {preview.length > 0 && (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-primary">Prévia das parcelas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Usado no resumo do contrato e na geração de promissórias. Pagamento
                pelo link do Asaas acima.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Parcela</th>
                    <th className="px-4 py-3 font-medium">Vencimento</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.n} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-primary">
                        {row.n}/{preview.length}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="date"
                          className="h-9"
                          value={
                            vencimentosOverrideIso[row.n - 1]
                              ? vencimentosOverrideIso[row.n - 1]
                              : row.vencimentoIso
                          }
                          onChange={(e) => {
                            const nextVal = e.target.value ?? "";
                            setVencimentosOverrideIso((prev) => {
                              const next = prev.slice();
                              while (next.length < nParcelas) next.push("");
                              next[row.n - 1] = nextVal;
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        R$ {row.valor.toFixed(2).replace(".", ",")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/cliente/${id}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || valorNum <= 0}>
            {submitting ? "Salvando…" : "Criar contrato"}
          </Button>
        </div>
      </form>
    </div>
  );
}
