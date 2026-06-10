import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Info,
  Landmark,
  List,
  MessageCircle,
  Package,
  Palette,
  Scale,
  Shield,
  Smartphone,
  Tag,
  Upload,
  Wallet,
} from "lucide-react";
import type { Contrato, ContractProductFields } from "@/data/mockData";
import { getContratoProdutos } from "@/lib/contractProducts";
import {
  CONTRACT_STATUS_BADGE_CLASS,
  CONTRACT_STATUS_LABELS,
} from "@/lib/contractStatus";
import { buildWhatsAppUrl, WHATSAPP_HELP_MESSAGE } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatContractDate(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

type SpecItem = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function ProductSpecs({ produto }: { produto: ContractProductFields }) {
  const specs: SpecItem[] = [
    {
      icon: <Smartphone className="h-4 w-4" />,
      label: "Produto",
      value: produto.produtoModelo || produto.produtoCategoria || "—",
    },
    {
      icon: <Palette className="h-4 w-4" />,
      label: "Cor",
      value: produto.produtoCor || "—",
    },
    {
      icon: <Tag className="h-4 w-4" />,
      label: "Marca / categoria",
      value: produto.produtoCategoria || "—",
    },
    {
      icon: <BadgeCheck className="h-4 w-4" />,
      label: "Condição",
      value: produto.produtoEstado || "—",
    },
    {
      icon: <HardDrive className="h-4 w-4" />,
      label: "Série / IMEI",
      value:
        [produto.produtoSerie, produto.produtoImei, produto.produtoImei2]
          .filter(Boolean)
          .join(" • ") || "—",
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: "Acessórios",
      value: produto.produtoAcessorios || "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {specs.map((s) => (
        <div key={s.label} className="flex gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
            <p className="text-sm font-semibold text-foreground leading-snug break-words">
              {s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-base font-bold text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export type ContratoDetailViewProps = {
  contrato: Contrato;
  mode: "client" | "admin";
  backHref: string;
  backLabel?: string;
  /** Barra superior (ações admin, voltar customizado). */
  topBar?: React.ReactNode;
  adminToolbar?: React.ReactNode;
  onUploadContract?: (file: File) => void;
  uploadingContract?: boolean;
};

export function ContratoDetailView({
  contrato,
  mode,
  backHref,
  backLabel = "Voltar",
  topBar,
  adminToolbar,
  onUploadContract,
  uploadingContract,
}: ContratoDetailViewProps) {
  const produtos = getContratoProdutos(contrato);
  const primeiraParcela = contrato.listaParcelas[0];
  const entrada = contrato.valorEntrada ?? 0;
  const financiado = Math.max(0, contrato.valor - entrada);
  const contratadoEm = formatContractDate(contrato.criadoEm);
  const paymentLinks = (contrato.paymentLinks ?? []).filter((l) => l.label && l.url);

  const handleDownloadContract = () => {
    if (contrato.contractDocumentUrl) {
      window.open(contrato.contractDocumentUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.info("Contrato ainda não disponível para download.");
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl space-y-4 pb-8",
        "max-sm:origin-top max-sm:scale-[0.94]",
      )}
    >
      {topBar ?? (
        <div className="flex items-center gap-2">
          <Link to={backHref}>
            <Button variant="ghost" size="icon" type="button" aria-label={backLabel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-primary sm:text-xl">Contrato</h1>
        </div>
      )}

      {adminToolbar ? (
        <div className="rounded-xl border bg-muted/30 p-3 sm:p-4 space-y-3">
          {adminToolbar}
        </div>
      ) : null}

      {/* Card do contrato */}
      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contrato</p>
              <p className="text-lg font-bold text-foreground">{contrato.numero}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-0.5 rounded-full",
                    CONTRACT_STATUS_BADGE_CLASS[contrato.status],
                  )}
                >
                  {CONTRACT_STATUS_LABELS[contrato.status]}
                </span>
                {contratadoEm ? (
                  <span className="text-xs text-muted-foreground">
                    Contratado em {contratadoEm}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {mode === "client" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={handleDownloadContract}
            >
              <Download className="h-4 w-4" />
              Baixar contrato
            </Button>
          ) : (
            <label
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                (uploadingContract || !onUploadContract) && "pointer-events-none opacity-50",
              )}
            >
              <Upload className="h-4 w-4" />
              {uploadingContract ? "Enviando…" : "Enviar contrato"}
              <input
                type="file"
                className="sr-only"
                accept=".pdf,image/*"
                disabled={uploadingContract || !onUploadContract}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && onUploadContract) onUploadContract(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </section>

      {/* Sobre o produto */}
      <SectionCard icon={<Package className="h-4 w-4" />} title="Sobre o produto">
        <div className="space-y-6">
          {produtos.map((p, i) => (
            <div key={i}>
              {produtos.length > 1 ? (
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  Item {i + 1}
                </p>
              ) : null}
              <ProductSpecs produto={p} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Para pagar */}
      <SectionCard icon={<Wallet className="h-4 w-4" />} title="Para pagar">
        <div className="space-y-3">
          {paymentLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted/40 p-4 text-center">
              {mode === "client"
                ? "Links de pagamento em breve. Em caso de dúvida, fale com a Zavo."
                : "Nenhum link cadastrado. Edite o contrato para adicionar links do Asaas."}
            </p>
          ) : (
            paymentLinks.map((link, i) => (
              <div
                key={`${link.url}-${i}`}
                className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-center sm:p-4"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-primary leading-snug">{link.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                      Acesse o portal do banco parceiro para simular e contratar o
                      parcelamento.
                    </p>
                  </div>
                </div>
                {mode === "client" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 shrink-0 bg-secondary hover:bg-secondary/90 w-full sm:w-auto"
                    onClick={() =>
                      window.open(link.url, "_blank", "noopener,noreferrer")
                    }
                  >
                    Ir pagar
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2 shrink-0 w-full sm:w-auto"
                    onClick={() =>
                      window.open(link.url, "_blank", "noopener,noreferrer")
                    }
                  >
                    Abrir link
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2.5">
          <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            O pagamento das parcelas é de responsabilidade do banco parceiro.
          </p>
        </div>
      </SectionCard>

      {/* Resumo */}
      <SectionCard icon={<List className="h-4 w-4" />} title="Resumo do contrato">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            {
              icon: <Scale className="h-4 w-4" />,
              label: "Valor do produto",
              value: formatBRL(contrato.valor),
            },
            {
              icon: <Wallet className="h-4 w-4" />,
              label: "Entrada",
              value:
                contrato.valorEntrada != null && contrato.valorEntrada > 0
                  ? formatBRL(contrato.valorEntrada)
                  : "—",
            },
            {
              icon: <Package className="h-4 w-4" />,
              label: "Valor financiado",
              value: formatBRL(financiado),
            },
            {
              icon: <Building2 className="h-4 w-4" />,
              label: "Instituição financeira",
              value: contrato.instituicaoFinanceira?.trim() || "—",
            },
            {
              icon: <Calendar className="h-4 w-4" />,
              label: "Vencimento da 1ª parcela",
              value: primeiraParcela?.vencimento ?? "—",
            },
            {
              icon: <Clock className="h-4 w-4" />,
              label: "Quantidade de parcelas",
              value: `${contrato.parcelas}x`,
            },
          ].map((item) => (
            <div key={item.label} className="flex gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-tight">{item.label}</p>
                <p className="text-sm font-semibold text-foreground leading-snug break-words">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Informações importantes */}
      <SectionCard icon={<Shield className="h-4 w-4" />} title="Informações importantes">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {[
            {
              icon: <Calendar className="h-4 w-4" />,
              text: "Em caso de atraso, entre em contato com o banco parceiro.",
            },
            {
              icon: <FileText className="h-4 w-4" />,
              text: "Mantenha seus dados atualizados com a Zavo.",
            },
            {
              icon: <MessageCircle className="h-4 w-4" />,
              text: "Dúvidas? Fale com nosso suporte.",
            },
          ].map((tip) => (
            <div
              key={tip.text}
              className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3"
            >
              <div className="text-primary shrink-0">{tip.icon}</div>
              <p className="text-[11px] text-muted-foreground leading-snug">{tip.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Ajuda */}
      <section className="rounded-xl border bg-card p-4 sm:p-5 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-5 w-5" />
        </div>
        <h2 className="text-base font-bold text-primary">Precisa de ajuda?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nossa equipe está pronta para te atender.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 gap-2"
          onClick={() =>
            window.open(buildWhatsAppUrl(WHATSAPP_HELP_MESSAGE), "_blank", "noopener,noreferrer")
          }
        >
          <MessageCircle className="h-4 w-4" />
          Falar com a Zavo
        </Button>
      </section>
    </div>
  );
}
