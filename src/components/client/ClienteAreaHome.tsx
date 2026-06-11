import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  FileText,
  Lightbulb,
  MessageCircle,
  Shield,
  FileCheck,
  ShoppingBag,
  Handshake,
} from "lucide-react";
import type { Cliente, Contrato } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  CONTRACT_STATUS_BADGE_CLASS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VALUES,
  type ContractStatus,
} from "@/lib/contractStatus";
import {
  buildWhatsAppUrl,
  WHATSAPP_HELP_MESSAGE,
  WHATSAPP_REFERRAL_MESSAGE,
} from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type ClienteAreaHomeProps = {
  cliente: Cliente;
  contractHref: (contractId: string) => string;
  contractActionLabel?: string;
  /** Conteúdo extra no topo (ex.: voltar + nome no admin) */
  topBar?: React.ReactNode;
  /** Ações extras na seção de contratos (ex.: novo contrato) */
  contractsExtra?: React.ReactNode;
  produtosHref?: string;
  /** Visão do cliente: saudação + situação. Admin: ocultar. */
  showClientGreeting?: boolean;
};

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

function contractHasOverdue(contrato: Contrato): boolean {
  return contrato.listaParcelas.some((p) => p.status === "atrasado");
}

export function ClienteAreaHome({
  cliente,
  contractHref,
  contractActionLabel = "Ver detalhes",
  topBar,
  contractsExtra,
  produtosHref = "/cliente/produtos",
  showClientGreeting = true,
}: ClienteAreaHomeProps) {
  const [statusFilter, setStatusFilter] = useState<"todos" | ContractStatus>("todos");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const contratosFiltrados = useMemo(() => {
    if (statusFilter === "todos") return cliente.contratos;
    return cliente.contratos.filter((c) => c.status === statusFilter);
  }, [cliente.contratos, statusFilter]);

  const situacaoLabel = cliente.situacao === "irregular" ? "Irregular" : "Regular";
  const situacaoClass =
    cliente.situacao === "irregular"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-success/10 text-success border-success/20";

  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setCarouselIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onCarouselSelect();
    carouselApi.on("select", onCarouselSelect);
    return () => {
      carouselApi.off("select", onCarouselSelect);
    };
  }, [carouselApi, onCarouselSelect]);

  const slides = [
    {
      id: "referral",
      className: "bg-gradient-to-br from-[#1e4fd6] to-[#2563eb] text-white",
      content: (
        <div className="flex h-full min-h-[118px] items-stretch gap-2 p-3.5 sm:min-h-[168px] sm:gap-3 sm:p-6">
          <div className="flex flex-1 flex-col justify-center gap-2 pr-1 sm:gap-3 sm:pr-2">
            <div>
              <p className="text-[15px] font-bold leading-snug sm:text-xl">
                Indique um amigo e ganhe benefícios.
              </p>
              <p className="mt-0.5 text-xs text-white/90 leading-snug sm:mt-1 sm:text-sm">
                Ajude alguém a realizar seus sonhos com a Zavo.
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(WHATSAPP_REFERRAL_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[#1e4fd6] shadow-sm transition hover:bg-white/95 sm:px-4 sm:py-2 sm:text-sm"
            >
              Saiba mais
            </a>
          </div>
          <div className="flex w-14 shrink-0 items-center justify-center sm:w-28">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 sm:h-24 sm:w-24"
              aria-hidden
            >
              <Handshake className="h-7 w-7 text-white sm:h-12 sm:w-12" strokeWidth={1.75} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "parcelas",
      className: "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground",
      content: (
        <div className="flex h-full min-h-[118px] flex-col justify-center gap-2 p-3.5 sm:min-h-[168px] sm:gap-3 sm:p-6">
          <p className="text-[15px] font-bold leading-snug sm:text-xl">
            Acompanhe suas parcelas em um só lugar.
          </p>
          <p className="text-xs text-primary-foreground/90 leading-snug sm:text-sm">
            Veja vencimentos, copie boleto ou Pix e confira o status de cada pagamento
            nos seus contratos.
          </p>
          <a
            href="#seus-contratos"
            className="inline-flex w-fit items-center rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25 sm:px-4 sm:py-2 sm:text-sm"
          >
            Ver meus contratos
          </a>
        </div>
      ),
    },
    {
      id: "produtos",
      className: "bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground",
      content: (
        <div className="flex h-full min-h-[118px] flex-col justify-center gap-2 p-3.5 sm:min-h-[168px] sm:gap-3 sm:p-6">
          <p className="text-[15px] font-bold leading-snug sm:text-xl">
            Conheça os produtos da Zavo.
          </p>
          <p className="text-xs text-secondary-foreground/90 leading-snug sm:text-sm">
            Simule parcelas, veja condições e solicite novos produtos pelo portal.
          </p>
          <Link
            to={produtosHref}
            className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm transition hover:bg-white/95 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Ver produtos
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl space-y-3 pb-4 sm:space-y-5 sm:pb-6 md:space-y-6",
        "max-sm:origin-top max-sm:scale-[0.94]",
      )}
    >
      {topBar}

      {showClientGreeting && (
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl font-bold text-primary sm:text-2xl md:text-3xl">
            Olá, {firstName(cliente.nome)}!
          </h1>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs",
              situacaoClass,
            )}
          >
            Situação: {situacaoLabel}
          </span>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        <Carousel
          setApi={setCarouselApi}
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="pl-0">
                <div className={cn("overflow-hidden rounded-xl shadow-sm sm:rounded-2xl", slide.className)}>
                  {slide.content}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Slides">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={carouselIndex === i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => carouselApi?.scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                carouselIndex === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-11 sm:w-11 sm:rounded-xl">
              <MessageCircle className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary sm:text-base">Precisa de ajuda?</p>
              <p className="text-xs text-muted-foreground leading-snug sm:text-sm">
                Nossa equipe está pronta para atender você.
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
                Atendimento de seg a sex, das 8h às 18h
              </p>
            </div>
          </div>
          <a
            href={buildWhatsAppUrl(WHATSAPP_HELP_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#20bd5a] sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm sm:min-w-[180px]"
          >
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Falar com a Zavo
          </a>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="mb-2 flex items-center gap-1.5 sm:mb-4 sm:gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
          <h2 className="text-sm font-semibold text-primary sm:text-base">Dicas para você</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex flex-col gap-1 sm:gap-2">
            <Shield className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm sm:leading-snug">
              Mantenha seus dados atualizados para evitar pendências.
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:gap-2">
            <FileCheck className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm sm:leading-snug">
              Guarde bem seus documentos e acompanhe seu contrato.
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:gap-2">
            <Bell className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
            <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm sm:leading-snug">
              Fique atento aos nossos canais oficiais para comunicados.
            </p>
          </div>
        </div>
      </div>

      <div id="seus-contratos" className="scroll-mt-4 space-y-2 sm:space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-base font-semibold text-primary sm:text-lg">Seus Contratos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "todos" | ContractStatus)}
            >
              <SelectTrigger className="h-9 w-full text-xs sm:h-10 sm:w-[200px] sm:text-sm">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {CONTRACT_STATUS_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CONTRACT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contractsExtra}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {contratosFiltrados.map((contrato) => {
            const irregular = contractHasOverdue(contrato);
            return (
              <Link
                key={contrato.id}
                to={contractHref(contrato.id)}
                className="block rounded-xl border bg-card p-3 shadow-sm transition hover:border-primary/20 hover:shadow-md sm:rounded-2xl sm:p-5"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12 sm:rounded-xl">
                    <FileText className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                    <Shield className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="truncate text-sm font-bold text-primary sm:text-base">
                        {contrato.numero}
                      </p>
                      {irregular && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                          Irregular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      R$ {contrato.valor.toFixed(2).replace(".", ",")}
                    </p>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:mt-1 sm:px-2 sm:text-[11px]",
                        CONTRACT_STATUS_BADGE_CLASS[contrato.status],
                      )}
                    >
                      {CONTRACT_STATUS_LABELS[contrato.status]}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                </div>
                <span className="sr-only">{contractActionLabel}</span>
              </Link>
            );
          })}
          {contratosFiltrados.length === 0 && (
            <div className="rounded-2xl border bg-card py-12 text-center text-muted-foreground">
              Nenhum contrato encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
