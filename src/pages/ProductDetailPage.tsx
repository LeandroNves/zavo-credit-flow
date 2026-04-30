import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarCheck2,
  Menu,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  WalletCards,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalLandingProducts } from "@/hooks/useGlobalLandingProducts";
import {
  ALL_INSTALLMENTS,
  calculateInstallmentCents,
  formatBRLFromCents,
  parseProductColors,
} from "@/lib/productsStore";
import {
  CART_UPDATED_EVENT,
  loadCart,
  makeCartItemId,
  pickDefaultMonths,
  saveCart,
} from "@/lib/cartStore";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { RotatingProductImage } from "@/components/product/RotatingProductImage";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PAYMENT_LABELS: Record<number, string> = {
  6: "Econômico",
  12: "Pagar rápido",
  18: "Cabe no bolso",
  24: "Mais prazo",
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const products = useGlobalLandingProducts();
  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const images = product?.imageSrcs?.length ? product.imageSrcs : product ? [product.imageSrc] : [];
  const colors = parseProductColors(product?.color ?? "");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedSpec, setSelectedSpec] = useState(product?.specifications?.[0] ?? "");
  const [selectedMonths, setSelectedMonths] = useState<6 | 12 | 18 | 24>(6);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => loadCart());
  const [cartCount, setCartCount] = useState(() =>
    loadCart().reduce((sum, it) => sum + it.qty, 0),
  );
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    setMainImageIndex(0);
    setSelectedSpec(product?.specifications?.[0] ?? "");
    setSelectedMonths(6);
  }, [product?.id, product?.specifications]);

  useEffect(() => {
    const update = () => {
      const list = loadCart();
      setCartItems(list);
      setCartCount(list.reduce((sum, it) => sum + it.qty, 0));
    };
    window.addEventListener(CART_UPDATED_EVENT, update);
    return () => window.removeEventListener(CART_UPDATED_EVENT, update);
  }, []);

  const removeItem = (id: string) => {
    const next = cartItems.filter((it) => it.id !== id);
    setCartItems(next);
    saveCart(next);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCart([]);
  };

  if (!id) return <Navigate to="/produtos" replace />;
  if (!product && products.length > 0) return <Navigate to="/produtos" replace />;
  if (!product) return null;

  const mainImage = images[mainImageIndex] ?? images[0];
  const otherProducts = products.filter((p) => p.id !== product.id).slice(0, 8);

  const paymentPlans = ALL_INSTALLMENTS.map((months) => {
    const per = calculateInstallmentCents(product.priceCents, months);
    return {
      months,
      per,
      total: per * months,
      label: PAYMENT_LABELS[months],
    };
  });

  const addCurrentProductToCart = () => {
    const months = selectedMonths ?? pickDefaultMonths(product);
    const colorOptions = parseProductColors(product.color);
    const current = loadCart();
    const existingIdx = current.findIndex(
      (it) => it.productId === product.id && it.months === months,
    );

    if (existingIdx >= 0) {
      const next = current.map((it, idx) =>
        idx === existingIdx ? { ...it, qty: Math.min(99, it.qty + 1) } : it,
      );
      saveCart(next);
      toast.success("Produto adicionado ao carrinho.");
      return;
    }

    saveCart([
      {
        id: makeCartItemId(),
        productId: product.id,
        months: months as 6 | 12 | 18 | 24,
        qty: 1,
        selectedColors: colorOptions.slice(0, 2),
        addedAt: new Date().toISOString(),
      },
      ...current,
    ]);
    toast.success("Produto adicionado ao carrinho.");
  };

  return (
    <div className="min-h-screen bg-[#eaf3ff]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Zavo" className="h-32" />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <Link to="/" className="hover:text-secondary transition-colors">Início</Link>
            <Link to="/produtos" className="hover:text-secondary transition-colors">Produtos</Link>
            <a href="/#servicos" className="hover:text-secondary transition-colors">Serviços</a>
            <a href="/#diferenciais" className="hover:text-secondary transition-colors">Diferenciais</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="p-2" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu">
              {mobileMenu ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-3 animate-fade-in">
            <Link to="/" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Início</Link>
            <Link to="/produtos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Produtos</Link>
            <a href="/#servicos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Serviços</a>
            <a href="/#diferenciais" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Diferenciais</a>
          </div>
        )}
      </header>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Carrinho</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                  {cartItems.map((it) => {
                    const p = products.find((x) => x.id === it.productId);
                    if (!p) return null;
                    return (
                      <div key={it.id} className="rounded-xl border p-3 bg-white flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md bg-background overflow-hidden flex items-center justify-center">
                          <img src={(p.imageSrcs?.[0] ?? p.imageSrc)} alt={p.name} className="h-12 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{it.months}x • qtd {it.qty}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(it.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" className="w-full" onClick={clearCart}>
                  Limpar carrinho
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
              <div className="space-y-3">
                <div className="rounded-xl bg-white min-h-[320px] flex items-center justify-center p-4">
                  {mainImage && <img src={mainImage} alt={product.name} className="max-h-[360px] object-contain" />}
                </div>
                <div className="flex items-center gap-2 overflow-auto pb-1">
                  {images.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setMainImageIndex(idx)}
                      className={`w-14 h-14 rounded-md overflow-hidden bg-white flex-shrink-0 ${idx === mainImageIndex ? "ring-2 ring-blue-500" : "opacity-90 hover:opacity-100"}`}
                    >
                      <img src={src} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-4xl font-bold text-primary">{product.name}</h2>
                </div>

                {!!product.specifications?.length && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1.5">Especificações</p>
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
                    <p className="text-sm font-semibold text-primary mb-1.5">Cores</p>
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
                    <p className="text-sm font-semibold text-primary mb-1.5">Descrição</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{product.description}</p>
                  </div>
                )}

                {!!product.deliveryTime && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1.5">Prazo de entrega</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{product.deliveryTime}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-4 md:p-5">
            <h3 className="text-lg font-semibold text-primary mb-3">Escolha como pagar</h3>
            {product.priceCents > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {paymentPlans.map((plan) => (
                    <div
                      key={plan.months}
                      className={`rounded-xl bg-white p-3 cursor-pointer transition-all ${
                        plan.months === 6
                          ? selectedMonths === plan.months
                            ? "ring-2 ring-[#03EBB1] shadow-[0_0_0_2px_rgba(3,235,177,0.35)] bg-[#03EBB1]/10"
                            : "ring-2 ring-[#b8f7e9] hover:ring-[#7eeed5] bg-[#effff9]"
                          : plan.months === 12
                            ? selectedMonths === plan.months
                              ? "ring-2 ring-[#4cc9ff] shadow-[0_0_0_2px_rgba(76,201,255,0.35)] bg-[#4cc9ff]/15"
                              : "ring-2 ring-[#4cc9ff]/70 hover:ring-[#4cc9ff] bg-[#4cc9ff]/8"
                            : plan.months === 18
                              ? selectedMonths === plan.months
                                ? "ring-2 ring-[#1d4ed8] shadow-[0_0_0_2px_rgba(29,78,216,0.35)] bg-[#1d4ed8]/15"
                                : "ring-2 ring-[#1d4ed8]/70 hover:ring-[#1d4ed8] bg-[#1d4ed8]/8"
                              : selectedMonths === plan.months
                                ? "ring-2 ring-[#5b4bff] shadow-[0_0_0_2px_rgba(91,75,255,0.35)] bg-[#5b4bff]/15"
                                : "ring-2 ring-[#5b4bff]/70 hover:ring-[#5b4bff] bg-[#5b4bff]/8"
                      }`}
                      onClick={() => setSelectedMonths(plan.months)}
                    >
                      {plan.months === 6 && (
                        <p className="text-sm text-[#03EBB1] font-extrabold mb-1">Mais econômico</p>
                      )}
                      {selectedMonths === plan.months && (
                        <p
                          className={`text-sm font-extrabold mb-1 ${
                            plan.months === 6
                              ? "text-[#03EBB1]"
                              : plan.months === 12
                                ? "text-[#4cc9ff]"
                                : plan.months === 18
                                  ? "text-[#1d4ed8]"
                                  : "text-[#5b4bff]"
                          }`}
                        >
                          Selecionado para o carrinho
                        </p>
                      )}
                      <p className={`font-bold leading-none ${plan.months === 6 ? "text-[#03EBB1] text-4xl" : "text-primary text-3xl"}`}>
                        {plan.months}x
                      </p>
                      <p className="text-sm text-primary mt-1">de {formatBRLFromCents(plan.per)}</p>
                      <p className="text-xs text-muted-foreground mt-3">Total: {formatBRLFromCents(plan.total)}</p>
                      <p className="text-xs text-muted-foreground">à vista no prazo</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
                  {[
                    { icon: CalendarCheck2, text: "Pague em dia e garanta desconto na sua parcela" },
                    { icon: ShieldCheck, text: "Seu produto é seu desde o início" },
                    { icon: BadgeCheck, text: "Processo simples, rápido e 100% online" },
                    { icon: Sparkles, text: "Atendimento próximo e humanizado" },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="rounded-xl bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 p-3.5 text-xs text-blue-900 flex items-center gap-2.5 shadow-sm"
                    >
                      <item.icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button className="w-full max-w-sm flex h-14 rounded-2xl gap-2 text-base" onClick={addCurrentProductToCart}>
                      <ShoppingCart className="h-4 w-4" />
                      Adicionar ao carrinho ({selectedMonths}x)
                    </Button>
                    <Button
                      className="w-full max-w-sm h-14 rounded-2xl text-base font-bold text-primary"
                      style={{ backgroundColor: "#03EBB1" }}
                      onClick={addCurrentProductToCart}
                    >
                      Comprar à vista (1x)
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Consulte valores com nosso time.</p>
            )}
          </section>

          {otherProducts.length > 0 && (
            <section className="bg-white rounded-2xl p-4 md:p-5">
              <h3 className="text-lg font-semibold text-primary mb-3">Mais opções de produtos</h3>
              <Carousel opts={{ align: "start", loop: true }} className="max-w-6xl mx-auto">
                <CarouselContent>
                  {otherProducts.map((p) => {
                    const per6 = p.priceCents ? calculateInstallmentCents(p.priceCents, 6) : 0;
                    return (
                      <CarouselItem key={p.id} className="sm:basis-1/2 lg:basis-1/4">
                        <Link to={`/produtos/${p.id}`} className="block bg-white rounded-xl p-3 h-full hover:shadow-md transition-shadow">
                          <div className="h-32 flex items-center justify-center mb-2">
                            <RotatingProductImage
                              images={p.imageSrcs?.length ? p.imageSrcs : [p.imageSrc]}
                              alt={p.name}
                              containerClassName="h-28 w-full"
                              intervalMs={3000}
                            />
                          </div>
                          <p className="text-sm font-semibold text-primary">{p.name}</p>
                          {p.priceCents > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground mt-1">A partir de 6x de</p>
                              <p className="text-2xl font-bold text-blue-600 leading-none mt-1">{formatBRLFromCents(per6)}</p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">Consulte valores</p>
                          )}
                        </Link>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>

              <div className="text-center mt-4">
                <Button asChild variant="outline" className="rounded-full px-8">
                  <Link to="/produtos">Ver mais produtos</Link>
                </Button>
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-cyan-700 text-white p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm shadow-lg">
                {[
                  "Parcela que cabe no seu bolso",
                  "Desconto por pagamento em dia",
                  "Seu eletrônico, do seu jeito de pagar",
                  "Compra segura e transparente",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <WalletCards className="h-5 w-5 text-cyan-300 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
