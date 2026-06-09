import { useState } from "react";
import { Check, ChevronRight, Info, Pencil, ShoppingCart, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DOWN_PAYMENT_OPTIONS,
  type DownPaymentOptionId,
  type InstallmentMonths,
  formatBRLFromCents,
} from "@/lib/productsStore";

export type PaymentPlanView = {
  months: InstallmentMonths;
  perInstallmentCents: number;
  earlyPaymentPerInstallmentCents: number;
  downPaymentCents: number;
};

const DISCOUNT_INFO_MESSAGE =
  "Na contratação, você escolhe o dia do vencimento. Sempre que o pagamento for realizado até essa data, o desconto de pontualidade será aplicado automaticamente.";

function DiscountInfoHint() {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="hidden md:inline-flex shrink-0 rounded-full p-0.5 text-success opacity-80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Sobre o desconto de pontualidade"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[280px] text-left text-xs leading-snug px-3 py-2"
        >
          {DISCOUNT_INFO_MESSAGE}
        </TooltipContent>
      </Tooltip>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="md:hidden inline-flex shrink-0 rounded-full p-0.5 text-success opacity-80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Sobre o desconto de pontualidade"
          >
            <Info className="h-3 w-3" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="max-w-[min(280px,calc(100vw-2rem))] text-xs leading-snug p-3"
        >
          {DISCOUNT_INFO_MESSAGE}
        </PopoverContent>
      </Popover>
    </>
  );
}

type ProductPaymentPanelProps = {
  paymentPlans: PaymentPlanView[];
  selectedMonths: InstallmentMonths;
  onSelectMonths: (months: InstallmentMonths) => void;
  selectedDownPayment: DownPaymentOptionId;
  onSelectDownPayment: (id: DownPaymentOptionId) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  compact?: boolean;
};

export function ProductPaymentPanel({
  paymentPlans,
  selectedMonths,
  onSelectMonths,
  selectedDownPayment,
  onSelectDownPayment,
  onAddToCart,
  onBuyNow,
  compact = false,
}: ProductPaymentPanelProps) {
  const [entryPanelOpen, setEntryPanelOpen] = useState(false);

  const selectedPlan =
    paymentPlans.find((p) => p.months === selectedMonths) ?? paymentPlans[0];
  const entryLabel =
    DOWN_PAYMENT_OPTIONS.find((x) => x.id === selectedDownPayment)?.label ?? "Sem entrada";
  const entryLinkLabel =
    selectedDownPayment !== "none" || entryPanelOpen ? "Alterar entrada" : "Adicionar entrada";

  return (
    <div
      className={`space-y-2.5 md:space-y-4 ${
        compact ? "" : "rounded-2xl border bg-card p-3 md:p-5 shadow-sm"
      }`}
    >
      <div>
        <h3 className="text-sm md:text-base font-bold text-primary">Escolha seu parcelamento</h3>
        <div className="mt-2 md:mt-3 grid grid-cols-2 gap-2 md:gap-2.5">
          {paymentPlans.map((plan) => {
            const selected = selectedMonths === plan.months;
            return (
              <button
                key={plan.months}
                type="button"
                onClick={() => onSelectMonths(plan.months)}
                className={`relative rounded-lg md:rounded-xl border-2 p-2 md:p-3 text-left transition-all ${
                  selected
                    ? "border-secondary bg-secondary/5 shadow-sm ring-1 ring-secondary/30"
                    : "border-border bg-white hover:border-secondary/40"
                }`}
              >
                {plan.months === 6 && (
                  <span className="absolute -top-2 left-1.5 rounded-full bg-success px-1.5 py-px text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-success-foreground shadow-sm">
                    Mais econômico
                  </span>
                )}
                <div className="flex items-start justify-between gap-1">
                  <p
                    className={`text-sm md:text-lg font-bold leading-tight ${
                      selected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {plan.months} meses
                  </p>
                  {selected && (
                    <span className="flex h-4 w-4 md:h-5 md:w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <div className="rounded-xl md:rounded-2xl border bg-white p-3 md:p-4 space-y-2 md:space-y-3">
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Parcelas</p>
            <p className="text-lg md:text-2xl font-bold text-primary">
              {selectedPlan.months}x de{" "}
              <span className="text-secondary">
                {formatBRLFromCents(selectedPlan.perInstallmentCents)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-success">
            <p className="text-xs md:text-sm font-semibold">
              {formatBRLFromCents(selectedPlan.earlyPaymentPerInstallmentCents)} até o vencimento
            </p>
            <DiscountInfoHint />
          </div>

          <div className="border-t pt-2 md:pt-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] md:text-xs text-muted-foreground">Entrada</p>
                <p className="text-xs md:text-sm font-semibold text-primary">
                  {selectedDownPayment === "none" ? "Sem entrada" : entryLabel}
                </p>
              </div>
              <p className="text-base md:text-lg font-bold text-primary">
                {formatBRLFromCents(selectedPlan.downPaymentCents)}
              </p>
            </div>
            <button
              type="button"
              className="mt-1.5 md:mt-2 inline-flex items-center gap-1 text-xs md:text-sm font-medium text-secondary hover:underline"
              onClick={() => setEntryPanelOpen((v) => !v)}
            >
              <Pencil className="h-3 w-3 md:h-3.5 md:w-3.5" />
              {entryLinkLabel}
            </button>
          </div>

          {entryPanelOpen && (
            <div className="grid grid-cols-2 gap-1.5 md:gap-2 pt-1 animate-fade-in">
              {DOWN_PAYMENT_OPTIONS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onSelectDownPayment(entry.id);
                    setEntryPanelOpen(true);
                  }}
                  className={`rounded-lg md:rounded-xl border px-2 py-2 md:px-3 md:py-2.5 text-xs md:text-sm font-medium text-left transition-colors ${
                    selectedDownPayment === entry.id
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border bg-muted/30 text-primary hover:bg-muted/60"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-lg md:rounded-xl border border-secondary/25 bg-secondary/5 px-2.5 py-2 md:px-3 md:py-2.5 text-left text-xs md:text-sm font-medium text-primary transition-colors hover:bg-secondary/10"
      >
        <span>Pague em dia e garanta desconto na sua parcela</span>
        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 text-secondary" />
      </button>

      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <Button
          variant="outline"
          className="h-12 rounded-xl gap-2 border-secondary text-secondary hover:bg-secondary/5"
          onClick={onAddToCart}
        >
          <ShoppingCart className="h-4 w-4" />
          Adicionar ao carrinho
        </Button>
        <Button className="h-12 rounded-xl gap-2 font-bold" onClick={onBuyNow}>
          <WalletCards className="h-4 w-4" />
          Comprar agora
        </Button>
      </div>
    </div>
  );
}

/** Barra fixa no rodapé (mobile). */
export function ProductPaymentStickyBar({
  selectedMonths,
  onAddToCart,
  onBuyNow,
}: {
  selectedMonths: InstallmentMonths;
  onAddToCart: () => void;
  onBuyNow: () => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur-md p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-2 gap-1.5 max-w-lg mx-auto">
        <Button
          variant="outline"
          className="h-9 rounded-lg gap-1 border-secondary text-secondary text-xs"
          onClick={onAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Carrinho
        </Button>
        <Button className="h-9 rounded-lg gap-1 text-xs font-bold" onClick={onBuyNow}>
          <WalletCards className="h-3.5 w-3.5" />
          Comprar ({selectedMonths}x)
        </Button>
      </div>
    </div>
  );
}
