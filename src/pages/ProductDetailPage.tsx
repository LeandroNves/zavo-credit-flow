import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalLandingProducts } from "@/hooks/useGlobalLandingProducts";
import {
  ALL_INSTALLMENTS,
  calculateInstallmentCents,
  formatBRLFromCents,
  parseProductColors,
} from "@/lib/productsStore";

const PLAN_LABELS: Record<number, string> = {
  6: "Plano econômico",
  12: "Pagar rápido",
  18: "Cabe no bolso",
  24: "Prazo estendido",
};

const PLAN_CARD_CLASSES: Record<number, string> = {
  6: "from-cyan-400 via-emerald-400 to-blue-700",
  12: "from-blue-500 via-blue-600 to-blue-900",
  18: "from-indigo-500 via-blue-600 to-blue-900",
  24: "from-violet-500 via-indigo-600 to-indigo-900",
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const products = useGlobalLandingProducts();
  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const images = product?.imageSrcs?.length ? product.imageSrcs : product ? [product.imageSrc] : [];
  const colors = parseProductColors(product?.color ?? "");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedSpec, setSelectedSpec] = useState(product?.specifications?.[0] ?? "");

  useEffect(() => {
    setMainImageIndex(0);
    setSelectedSpec(product?.specifications?.[0] ?? "");
  }, [product?.id, product?.specifications]);

  if (!id) return <Navigate to="/produtos" replace />;
  if (!product && products.length > 0) return <Navigate to="/produtos" replace />;
  if (!product) return null;

  const mainImage = images[mainImageIndex] ?? images[0];

  const paymentPlans = ALL_INSTALLMENTS.map((months) => {
    const per = calculateInstallmentCents(product.priceCents, months);
    return {
      months,
      per,
      total: per * months,
      label: PLAN_LABELS[months],
    };
  });

  return (
    <div className="min-h-screen bg-background/40">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Voltar para produtos
          </Link>
          <h1 className="text-lg font-semibold text-primary">Detalhes do produto</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-white rounded-2xl border p-5">
            <div className="grid grid-cols-1 md:grid-cols-[96px_1fr_1fr] gap-4">
              <div className="flex md:flex-col gap-2 overflow-auto">
                {images.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() => setMainImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg border overflow-hidden bg-background flex-shrink-0 ${idx === mainImageIndex ? "ring-2 ring-secondary border-secondary" : ""}`}
                  >
                    <img src={src} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>

              <div className="rounded-xl border bg-background min-h-[360px] flex items-center justify-center p-4">
                {mainImage && <img src={mainImage} alt={product.name} className="max-h-[420px] object-contain" />}
              </div>

              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{product.name}</h2>
                </div>

                {!!product.specifications?.length && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">Especificações</p>
                    <div className="flex flex-wrap gap-2">
                      {product.specifications.map((spec) => (
                        <Button
                          key={`${product.id}-${spec}`}
                          type="button"
                          variant={selectedSpec === spec ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setSelectedSpec(spec)}
                        >
                          {spec}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!!colors.length && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">Cores</p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color, idx) => (
                        <Button
                          key={`${product.id}-${color}-${idx}`}
                          type="button"
                          variant={idx === mainImageIndex ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setMainImageIndex(Math.min(idx, images.length - 1))}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!!product.description && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-2">Descrição</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="xl:col-span-4 bg-white rounded-2xl border p-5 h-fit">
            <h3 className="text-lg font-semibold text-primary mb-4">Planos de pagamento</h3>
            {product.priceCents > 0 ? (
              <div className="space-y-1.5">
                <div className="rounded-lg border border-cyan-300 bg-gradient-to-br from-cyan-500 via-emerald-500 to-blue-900 p-1.5 text-white shadow-lg">
                  {paymentPlans
                    .filter((plan) => plan.months === 6)
                    .map((plan) => (
                      <div key={plan.months}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[8px] uppercase tracking-wide bg-black/20 rounded-full px-1.5 py-0.5 inline-block">
                              Plano
                            </p>
                            <p className="text-lg font-black leading-none mt-0.5">{plan.months}x</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black uppercase leading-none">{plan.label}</p>
                            <p className="text-[9px] opacity-90">Mais barato de todos</p>
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] font-semibold">Total do plano: {formatBRLFromCents(plan.total)}</p>
                        <div className="mt-1 rounded-md bg-black/25 p-1">
                          <p className="text-[10px] font-medium opacity-90">{plan.months}x de</p>
                          <p className="text-xl font-black leading-none mt-0.5">{formatBRLFromCents(plan.per)}</p>
                          <div className="mt-1 rounded-md bg-slate-950/75 p-1.5 flex items-center gap-1">
                            <CalendarCheck2 className="h-3 w-3 text-emerald-300 flex-shrink-0" />
                            <div>
                              <p className="text-base font-black leading-none text-emerald-300">{formatBRLFromCents(plan.per)}</p>
                              <p className="text-[8px] uppercase tracking-wide opacity-90">Pagando até o vencimento</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-1.5">
                  {paymentPlans
                    .filter((plan) => plan.months !== 6)
                    .map((plan) => (
                      <div
                        key={plan.months}
                        className={`rounded-lg border border-blue-400/60 bg-gradient-to-br ${PLAN_CARD_CLASSES[plan.months]} p-1.5 text-white shadow-md`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[8px] uppercase tracking-wide bg-black/20 rounded-full px-1.5 py-0.5 inline-block">
                              Plano
                            </p>
                            <p className="text-lg font-black leading-none mt-0.5">{plan.months}x</p>
                          </div>
                          <p className="text-[11px] font-black uppercase leading-none text-right">{plan.label}</p>
                        </div>
                        <p className="mt-1 text-[10px] font-semibold">Total do plano: {formatBRLFromCents(plan.total)}</p>
                        <div className="mt-1 rounded-md bg-black/25 p-1">
                          <p className="text-[10px] font-medium opacity-90">{plan.months}x de</p>
                          <p className="text-xl font-black leading-none mt-0.5">{formatBRLFromCents(plan.per)}</p>
                          <div className="mt-1 rounded-md bg-slate-950/75 p-1.5 flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3 text-emerald-300 flex-shrink-0" />
                            <div>
                              <p className="text-base font-black leading-none text-emerald-300">{formatBRLFromCents(plan.per)}</p>
                              <p className="text-[8px] uppercase tracking-wide opacity-90">Pagando até o vencimento</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Consulte valores com nosso time.</p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
