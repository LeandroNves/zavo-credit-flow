import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getClienteAtualId } from "@/lib/clienteSession";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  ALL_INSTALLMENTS,
  PRODUCTS_UPDATED_EVENT,
  calculateInstallmentCents,
  formatBRLFromCents,
  loadLandingProducts,
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

export default function ClientProducts() {
  const [products, setProducts] = useState<LandingProduct[]>(() => loadLandingProducts());
  const [items, setItems] = useState<ClientProductCartItem[]>(() => loadClientProductCart());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onProductsUpdate = () => setProducts(loadLandingProducts());
    const onCartUpdate = () => setItems(loadClientProductCart());
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onProductsUpdate);
    window.addEventListener(CLIENT_PRODUCT_CART_UPDATED_EVENT, onCartUpdate);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, onProductsUpdate);
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
    const months = pickDefaultMonths(p);
    const idx = items.findIndex((it) => it.productId === productId && it.months === months);
    if (idx >= 0) {
      persist(items.map((it, i) => (i === idx ? { ...it, qty: Math.min(99, it.qty + 1) } : it)));
      return;
    }
    persist([{ id: makeClientProductCartItemId(), productId, months, qty: 1, addedAt: new Date().toISOString() }, ...items]);
  }

  function setQty(id: string, qty: number) {
    const q = Math.max(1, Math.min(99, Math.round(qty)));
    persist(items.map((it) => (it.id === id ? { ...it, qty: q } : it)));
  }

  function setMonths(id: string, months: number) {
    if (![6, 12, 18, 24].includes(months)) return;
    persist(items.map((it) => (it.id === id ? { ...it, months: months as InstallmentMonths } : it)));
  }

  const cartCount = items.reduce((sum, it) => sum + it.qty, 0);
  const hasInvalid = items.some((it) => {
    const p = products.find((x) => x.id === it.productId);
    return !p || !p.priceCents;
  });

  const cartLines = useMemo(
    () =>
      items
        .map((it) => {
          const p = products.find((x) => x.id === it.productId);
          if (!p) return null;
          const per = calculateInstallmentCents(p.priceCents, it.months);
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
      color: p.color,
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
            const months = (p.enabledMonths?.length ? p.enabledMonths : ALL_INSTALLMENTS).slice().sort((a, b) => a - b);
            const firstMonths = months[0] as InstallmentMonths;
            const firstPer = calculateInstallmentCents(p.priceCents, firstMonths);
            return (
              <div key={p.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="h-40 rounded-lg border bg-background flex items-center justify-center overflow-hidden">
                  <img src={p.imageSrc} alt={p.name} className="h-32 object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-primary">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.color}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  A partir de <span className="font-semibold text-primary">{firstMonths}x de {formatBRLFromCents(firstPer)}</span>
                </p>
                <Button className="w-full rounded-full" onClick={() => addToCart(p.id)}>
                  <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
                </Button>
              </div>
            );
          })}
          {products.length === 0 && (
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
                            {m}x de {formatBRLFromCents(calculateInstallmentCents(p.priceCents, m))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{it.months}x</span> de{" "}
                    <span className="font-semibold text-primary">{p.priceCents ? formatBRLFromCents(per) : "—"}</span>
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

