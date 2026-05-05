import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getClienteAtualId } from "@/lib/clienteSession";
import { useGlobalLandingProductsState } from "@/hooks/useGlobalLandingProducts";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  ALL_INSTALLMENTS,
  calculateInstallmentCents,
  formatBRLFromCents,
  getDefaultProductModel,
  getProductModelOptions,
  getProductPriceCentsByModel,
  parseProductColors,
  type InstallmentMonths,
  type LandingProduct,
} from "@/lib/productsStore";
import {
  CLIENT_PRODUCT_CART_UPDATED_EVENT,
  loadClientProductCart,
  makeClientProductCartItemId,
  pickDefaultMonths,
  saveClientProductCart,
  type ClientProductCartItem,
} from "@/lib/clientProductCartStore";
import { createProductRequest } from "@/lib/productRequestsSupabase";
import { RotatingProductImage } from "@/components/product/RotatingProductImage";

export default function ClientProducts() {
  const { products, isLoading } = useGlobalLandingProductsState();
  const [items, setItems] = useState<ClientProductCartItem[]>(() => loadClientProductCart());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onCartUpdate = () => setItems(loadClientProductCart());
    window.addEventListener(CLIENT_PRODUCT_CART_UPDATED_EVENT, onCartUpdate);
    return () => {
      window.removeEventListener(CLIENT_PRODUCT_CART_UPDATED_EVENT, onCartUpdate);
    };
  }, []);

  function persist(next: ClientProductCartItem[]) {
    setItems(next);
    saveClientProductCart(next);
  }

  function addToCart(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const selectedModel = getDefaultProductModel(p);
    const months = pickDefaultMonths(p);
    const colorOptions = parseProductColors(p.color);
    const idx = items.findIndex(
      (it) => it.productId === productId && it.selectedModel === selectedModel && it.months === months,
    );
    if (idx >= 0) {
      persist(items.map((it, i) => (i === idx ? { ...it, qty: Math.min(99, it.qty + 1) } : it)));
      return;
    }
    persist([{
      id: makeClientProductCartItemId(),
      productId,
      selectedModel,
      months,
      qty: 1,
      selectedColors: colorOptions.slice(0, 2),
      addedAt: new Date().toISOString(),
    }, ...items]);
  }

  function setQty(id: string, qty: number) {
    const q = Math.max(1, Math.min(99, Math.round(qty)));
    persist(items.map((it) => (it.id === id ? { ...it, qty: q } : it)));
  }

  function setMonths(id: string, months: number) {
    if (![6, 12, 18, 24].includes(months)) return;
    persist(items.map((it) => (it.id === id ? { ...it, months: months as InstallmentMonths } : it)));
  }

  function setModel(id: string, model: string) {
    persist(items.map((it) => (it.id === id ? { ...it, selectedModel: model } : it)));
  }

  function setPreferredColor(id: string, color: string) {
    persist(items.map((it) => (it.id === id ? { ...it, selectedColors: [color, it.selectedColors?.[1] ?? ""].filter(Boolean) } : it)));
  }

  function setAlternativeColor(id: string, color: string) {
    persist(items.map((it) => (it.id === id ? { ...it, selectedColors: [it.selectedColors?.[0] ?? "", color].filter(Boolean) } : it)));
  }

  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const hasInvalid = items.some((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (!p) return true;
    return getProductPriceCentsByModel(p, it.selectedModel) <= 0;
  });
  const hasMissingColors = items.some((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (!p) return true;
    const chosen = (it.selectedColors ?? []).filter(Boolean);
    const options = parseProductColors(p.color);
    if (options.length >= 2) return chosen.length < 2 || chosen[0] === chosen[1];
    return chosen.length < 2;
  });

  const cartLines = useMemo(
    () =>
      items
        .map((it) => {
          const p = products.find((x) => x.id === it.productId);
          if (!p) return null;
          const selectedPriceCents = getProductPriceCentsByModel(p, it.selectedModel);
          const per = calculateInstallmentCents(selectedPriceCents, it.months);
          return { it, p, per };
        })
        .filter(Boolean) as Array<{ it: ClientProductCartItem; p: LandingProduct; per: number }>,
    [items, products],
  );

  async function finalizeRequest() {
    if (!supabase || !isSupabaseConfigured) {
      toast.error("Supabase não configurado.");
      return;
    }
    if (items.length === 0) {
      toast.error("Adicione ao menos um produto no carrinho.");
      return;
    }
    if (hasInvalid) {
      toast.error("Há item sem preço configurado.");
      return;
    }
    if (hasMissingColors) {
      toast.error("Selecione duas cores por produto (preferencial e alternativa).");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const clientId = getClienteAtualId();
    if (!user || !clientId) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    const payloadItems = cartLines.map(({ it, p, per }) => ({
      productId: p.id,
      name: p.name,
      color: (it.selectedColors ?? []).join(" / ") || p.color,
      model: it.selectedModel,
      colors: (it.selectedColors ?? []).filter(Boolean).slice(0, 2),
      months: it.months,
      qty: it.qty,
      perInstallmentBRL: formatBRLFromCents(per),
    }));

    setSubmitting(true);
    try {
      await createProductRequest(supabase, {
        clientId,
        profileId: user.id,
        items: payloadItems,
      });
      persist([]);
      toast.success("Solicitação enviada para análise interna.");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível enviar a solicitação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Produtos</h1>
        <div className="text-sm text-muted-foreground">Itens no carrinho: {cartCount}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid sm:grid-cols-2 gap-4">
          {products.map((p) => {
            const per6 = p.priceCents ? calculateInstallmentCents(p.priceCents, 6) : 0;
            const per12 = p.priceCents ? calculateInstallmentCents(p.priceCents, 12) : 0;
            const total12 = per12 * 12;
            return (
              <div key={p.id} className="group bg-white rounded-2xl p-6 border border-border/50 hover:shadow-xl hover:border-secondary/30 transition-all duration-300 space-y-4">
                <div className="h-48 rounded-lg bg-background flex items-center justify-center overflow-hidden">
                  <RotatingProductImage
                    images={p.imageSrcs?.length ? p.imageSrcs : [p.imageSrc]}
                    alt={p.name}
                    containerClassName="h-40 w-full"
                    intervalMs={3000}
                  />
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">{p.name}</p>
                </div>
                {p.priceCents > 0 ? (
                  <div className="space-y-1">
                    <p className="text-base text-muted-foreground">
                      <span className="font-bold text-primary">A partir de 6x de {formatBRLFromCents(per6)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      12x de <span className="font-semibold text-primary">{formatBRLFromCents(per12)}</span> pagando até vencimento
                    </p>
                    <p className="text-xs text-muted-foreground">Total em 12x: {formatBRLFromCents(total12)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Consulte condições com nosso time.</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button className="w-full rounded-full" onClick={() => addToCart(p.id)}>
                    <ShoppingCart className="h-4 w-4" /> Adicionar
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link to={`/produtos/${p.id}`}>Ver produto</Link>
                  </Button>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="col-span-full text-center py-12 text-muted-foreground rounded-xl border bg-card">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando produtos...
              </div>
            </div>
          )}
          {!isLoading && products.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground rounded-xl border bg-card">
              Nenhum produto disponível no momento.
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-4 h-fit">
          <h2 className="font-semibold text-primary">Carrinho interno</h2>
          {cartLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não selecionou produtos.</p>
          ) : (
            <div className="space-y-3">
              {cartLines.map(({ it, p, per }) => (
                <div key={it.id} className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium text-primary">{p.name}</p>
                  {!!getProductModelOptions(p).length && (
                    <Select value={it.selectedModel} onValueChange={(v) => setModel(it.id, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {getProductModelOptions(p).map((opt) => (
                          <SelectItem key={`${it.id}-${opt.model}`} value={opt.model}>
                          {opt.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">{p.color}</p>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => setQty(it.id, it.qty - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{it.qty}</span>
                    <Button size="icon" variant="outline" onClick={() => setQty(it.id, it.qty + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="ml-auto text-destructive" onClick={() => persist(items.filter((x) => x.id !== it.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select value={String(it.months)} onValueChange={(v) => setMonths(it.id, Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(p.enabledMonths?.length ? p.enabledMonths : ALL_INSTALLMENTS)
                        .slice()
                        .sort((a, b) => a - b)
                        .map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {m}x de {formatBRLFromCents(calculateInstallmentCents(getProductPriceCentsByModel(p, it.selectedModel), m))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={it.selectedColors?.[0] ?? ""} onValueChange={(v) => setPreferredColor(it.id, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cor preferencial" />
                      </SelectTrigger>
                      <SelectContent>
                        {parseProductColors(p.color).map((c) => (
                          <SelectItem key={`cp-${it.id}-${c}`} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={it.selectedColors?.[1] ?? ""} onValueChange={(v) => setAlternativeColor(it.id, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cor alternativa" />
                      </SelectTrigger>
                      <SelectContent>
                        {parseProductColors(p.color).map((c) => (
                          <SelectItem key={`ca-${it.id}-${c}`} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{it.months}x</span> de{" "}
                    <span className="font-semibold text-primary">{formatBRLFromCents(per)}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button className="w-full" disabled={submitting || cartLines.length === 0 || hasInvalid} onClick={() => void finalizeRequest()}>
              {submitting ? "Enviando..." : "Finalizar solicitação"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => persist([])}>
              Limpar carrinho
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

