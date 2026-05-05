import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  Search,
  ShoppingCart,
  Loader2,
  Minus,
  Plus,
  Trash2,
  WalletCards,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalLandingProductsState } from "@/hooks/useGlobalLandingProducts";
import {
  ALL_INSTALLMENTS,
  DOWN_PAYMENT_OPTIONS,
  type DownPaymentOptionId,
  PRODUCT_CATEGORIES,
  type InstallmentMonths,
  calculateInstallmentWithDownPaymentCents,
  calculateInstallmentCents,
  formatBRLFromCents,
  getDefaultProductModel,
  getProductModelOptions,
  getProductPriceCentsByModel,
  parseProductColors,
} from "@/lib/productsStore";
import {
  CART_UPDATED_EVENT,
  type CartItem,
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildCartSnapshot, saveRegistrationInterest } from "@/lib/registrationInterest";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, isLoading } = useGlobalLandingProductsState();
  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const images = product?.imageSrcs?.length ? product.imageSrcs : product ? [product.imageSrc] : [];
  const colors = parseProductColors(product?.color ?? "");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<InstallmentMonths>(6);
  const [selectedDownPayment, setSelectedDownPayment] = useState<DownPaymentOptionId>("none");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => loadCart());
  const [cartCount, setCartCount] = useState(() => loadCart().reduce((sum, it) => sum + it.qty, 0));
  const [mobileMenu, setMobileMenu] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<"Todos" | (typeof PRODUCT_CATEGORIES)[number]>("Todos");
  const [catalogSort, setCatalogSort] = useState<"mais-vendidos" | "menor-preco" | "maior-preco" | "promocoes">("mais-vendidos");

  useEffect(() => {
    setMainImageIndex(0);
    setSelectedModel(product ? getDefaultProductModel(product) : "");
    setSelectedMonths(6);
    setSelectedDownPayment("none");
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product?.id]);

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

  const setQty = (id: string, qty: number) => {
    const q = Math.max(1, Math.min(99, Math.round(qty)));
    const next = cartItems.map((it) => (it.id === id ? { ...it, qty: q } : it));
    setCartItems(next);
    saveCart(next);
  };

  const setMonths = (id: string, months: number) => {
    if (![1, 6, 12, 18, 24].includes(months)) return;
    const next = cartItems.map((it) => (it.id === id ? { ...it, months: months as 1 | 6 | 12 | 18 | 24 } : it));
    setCartItems(next);
    saveCart(next);
  };

  const setPreferredColor = (id: string, color: string) => {
    const next = cartItems.map((it) => {
      if (it.id !== id) return it;
      const alt = it.selectedColors[1] ?? "";
      return { ...it, selectedColors: [color, alt].filter(Boolean) };
    });
    setCartItems(next);
    saveCart(next);
  };

  const setAlternativeColor = (id: string, color: string) => {
    const next = cartItems.map((it) => {
      if (it.id !== id) return it;
      const pref = it.selectedColors[0] ?? "";
      return { ...it, selectedColors: [pref, color].filter(Boolean) };
    });
    setCartItems(next);
    saveCart(next);
  };

  const goCheckoutCadastro = () => {
    const hasMissingPrice = cartItems.some((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return true;
      return getProductPriceCentsByModel(p, it.selectedModel) <= 0;
    });
    if (hasMissingPrice) {
      setCartOpen(true);
      return;
    }

    const hasMissingColors = cartItems.some((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return true;
      const options = parseProductColors(p.color);
      const chosen = (it.selectedColors ?? []).filter(Boolean);
      if (options.length >= 2) return chosen.length < 2 || chosen[0] === chosen[1];
      return chosen.length < 2;
    });
    if (hasMissingColors) {
      setCartOpen(true);
      toast.error("Selecione duas cores por produto (preferencial e alternativa).");
      return;
    }

    saveRegistrationInterest({
      interestType: "produto",
      cart: buildCartSnapshot({
        cartItems: cartItems as CartItem[],
        products,
      }),
    });
    setCartOpen(false);
    navigate("/cadastro");
  };

  if (!id) return <Navigate to="/produtos" replace />;
  if (!product && products.length > 0) return <Navigate to="/produtos" replace />;
  if (!product) {
    return (
      <div className="min-h-screen bg-[#eaf3ff] flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando produto...
          </div>
        ) : null}
      </div>
    );
  }

  const mainImage = images[mainImageIndex] ?? images[0];
  const otherProducts = products.filter((p) => p.id !== product.id).slice(0, 8);

  const selectedPriceCents = getProductPriceCentsByModel(product, selectedModel);
  const paymentPlans = ALL_INSTALLMENTS.map((months) => {
    const calc = calculateInstallmentWithDownPaymentCents({
      priceCents: selectedPriceCents,
      months,
      downPaymentOptionId: selectedDownPayment,
    });
    return {
      months,
      ...calc,
    };
  });
  const selectedPlan = paymentPlans.find((x) => x.months === selectedMonths) ?? paymentPlans[0];
  const originalMonthlyCents = calculateInstallmentCents(selectedPriceCents, selectedMonths);

  const addCurrentProductToCart = (forcedMonths?: 1 | 6 | 12 | 18 | 24) => {
    const months = forcedMonths ?? selectedMonths ?? pickDefaultMonths(product);
    const effectiveModel = selectedModel || getDefaultProductModel(product);
    const effectiveDownPayment: DownPaymentOptionId =
      forcedMonths === 1 ? "none" : selectedDownPayment;
    const colorOptions = parseProductColors(product.color);
    const current = loadCart();
    const existingIdx = current.findIndex(
      (it) =>
        it.productId === product.id &&
        it.selectedModel === effectiveModel &&
        (it.selectedDownPayment ?? "none") === effectiveDownPayment &&
        it.months === months,
    );

    if (existingIdx >= 0) {
      const next = current.map((it, idx) =>
        idx === existingIdx ? { ...it, qty: Math.min(99, it.qty + 1) } : it,
      );
      saveCart(next);
      setCartItems(next);
      setCartOpen(true);
      toast.success("Produto adicionado ao carrinho.");
      return;
    }

    const next: CartItem[] = [
      {
        id: makeCartItemId(),
        productId: product.id,
        selectedModel: effectiveModel,
        selectedDownPayment: effectiveDownPayment,
        months: months as 1 | 6 | 12 | 18 | 24,
        qty: 1,
        selectedColors: colorOptions.slice(0, 2),
        addedAt: new Date().toISOString(),
      },
      ...current,
    ];
    saveCart(next);
    setCartItems(next);
    setCartOpen(true);
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
          <div className="mt-6 flex flex-col h-[calc(100vh-7rem)]">
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-50" />
                <p className="font-medium text-foreground">Seu carrinho está vazio</p>
                <p className="text-sm mt-1">Adicione produtos para continuar.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto pr-1 space-y-4">
                  {cartItems.map((it) => {
                    const p = products.find((x) => x.id === it.productId);
                    if (!p) return null;
                    const allowedMonths = Array.from(
                      new Set(
                        [...(p.enabledMonths?.length ? p.enabledMonths : ALL_INSTALLMENTS), it.months].filter(Boolean),
                      ),
                    ).sort((a, b) => a - b);
                    const colorOptions = parseProductColors(p.color);
                    const preferred = it.selectedColors?.[0] ?? "";
                    const alternative = it.selectedColors?.[1] ?? "";
                    const missingColors =
                      colorOptions.length >= 2
                        ? !preferred || !alternative || preferred === alternative
                        : !preferred || !alternative;
                    const per = calculateInstallmentWithDownPaymentCents({
                      priceCents: getProductPriceCentsByModel(p, it.selectedModel),
                      months: it.months,
                      downPaymentOptionId: it.selectedDownPayment ?? "none",
                    }).perInstallmentCents;
                    return (
                      <div key={it.id} className="border rounded-xl p-3 bg-background">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                            <img src={(p.imageSrcs?.[0] ?? p.imageSrc)} alt={p.name} className="h-14 object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-primary truncate">{p.name}</p>
                                {it.selectedModel && <p className="text-xs text-muted-foreground truncate">Modelo: {it.selectedModel}</p>}
                                <p className="text-xs text-muted-foreground truncate">
                                  {DOWN_PAYMENT_OPTIONS.find((x) => x.id === (it.selectedDownPayment ?? "none"))?.label ?? "Sem entrada"}
                                </p>
                                {p.color && <p className="text-xs text-muted-foreground truncate">{p.color}</p>}
                              </div>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => removeItem(it.id)}
                                aria-label="Remover item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 items-center">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Parcelas</p>
                                <Select value={String(it.months)} onValueChange={(v) => setMonths(it.id, Number(v))}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allowedMonths.map((m) => (
                                      <SelectItem key={m} value={String(m)}>
                                        {m}x
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Qtd</p>
                                <div className="flex items-center justify-between border rounded-md h-9 px-2 bg-white">
                                  <button
                                    type="button"
                                    className="p-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => setQty(it.id, it.qty - 1)}
                                    aria-label="Diminuir quantidade"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="text-sm font-medium">{it.qty}</span>
                                  <button
                                    type="button"
                                    className="p-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => setQty(it.id, it.qty + 1)}
                                    aria-label="Aumentar quantidade"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Cor preferencial</p>
                                <Select value={preferred} onValueChange={(v) => setPreferredColor(it.id, v)}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Escolha" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorOptions.map((c) => (
                                      <SelectItem key={`pref-${it.id}-${c}`} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Cor alternativa</p>
                                <Select value={alternative} onValueChange={(v) => setAlternativeColor(it.id, v)}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Escolha" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorOptions.map((c) => (
                                      <SelectItem key={`alt-${it.id}-${c}`} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {missingColors && (
                              <p className="mt-2 text-xs text-destructive">
                                Selecione duas cores para este produto (preferencial e alternativa).
                              </p>
                            )}

                            <p className="mt-3 text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">{it.months}x</span> de{" "}
                              <span className="font-semibold text-primary">
                                {formatBRLFromCents(per)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t mt-4 space-y-2">
                  <Button
                    className="w-full rounded-full"
                    onClick={goCheckoutCadastro}
                    disabled={cartItems.some((it) => {
                      const p = products.find((x) => x.id === it.productId);
                      if (!p) return true;
                      return getProductPriceCentsByModel(p, it.selectedModel) <= 0;
                    })}
                  >
                    Finalizar compra
                  </Button>
                  <Button variant="outline" className="w-full rounded-full" onClick={clearCart}>
                    Limpar carrinho
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/produtos">
                <ArrowLeft className="h-4 w-4" />
                Voltar para produtos
              </Link>
            </Button>
          </div>

          <section className="bg-white border rounded-2xl p-4 md:p-5 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-primary">Nossos produtos</h3>
              <p className="text-sm text-muted-foreground">
                Navegue para a vitrine completa mantendo o filtro que você escolher.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Buscar produtos, marcas ou modelos..."
                />
              </div>
              <Select
                value={catalogCategory}
                onValueChange={(value) => setCatalogCategory(value as "Todos" | (typeof PRODUCT_CATEGORIES)[number])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas as categorias</SelectItem>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={catalogSort} onValueChange={(value) => setCatalogSort(value as "mais-vendidos" | "menor-preco" | "maior-preco" | "promocoes")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mais-vendidos">Mais vendidos</SelectItem>
                  <SelectItem value="menor-preco">Menor preço</SelectItem>
                  <SelectItem value="maior-preco">Maior preço</SelectItem>
                  <SelectItem value="promocoes">Promoções</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button asChild variant="outline" className="rounded-full">
                <Link
                  to={`/produtos?search=${encodeURIComponent(catalogSearch)}${catalogCategory !== "Todos" ? `&category=${encodeURIComponent(catalogCategory)}` : ""}&sort=${catalogSort}`}
                >
                  Ir para lista filtrada
                </Link>
              </Button>
            </div>

            <div className="flex gap-2 overflow-auto pb-1">
              <Link
                to={`/produtos?search=${encodeURIComponent(catalogSearch)}&sort=${catalogSort}`}
                className="px-4 py-2 rounded-full text-sm border whitespace-nowrap bg-primary text-primary-foreground border-primary"
              >
                Todos
              </Link>
              {PRODUCT_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to={`/produtos?search=${encodeURIComponent(catalogSearch)}&category=${encodeURIComponent(category)}&sort=${catalogSort}`}
                  className="px-4 py-2 rounded-full text-sm border whitespace-nowrap bg-white border-border hover:bg-muted"
                >
                  {category}
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_420px] gap-6">
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

                {!!getProductModelOptions(product).length && (
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1.5">Modelo</p>
                    <div className="flex flex-wrap gap-2">
                      {getProductModelOptions(product).map((opt) => (
                        <Button
                          key={`${product.id}-${opt.model}`}
                          type="button"
                          variant={selectedModel === opt.model ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setSelectedModel(opt.model)}
                        >
                          {opt.model}
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

              <div className="rounded-2xl border bg-[#fafafa] p-4 md:p-5 h-fit lg:sticky lg:top-24">
                <p className="text-xs md:text-sm font-semibold tracking-[0.08em] text-primary uppercase">Preço/mês</p>
                <p className="text-sm text-muted-foreground">No cartão de crédito ou pix automático</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-4xl font-bold text-primary">
                    {formatBRLFromCents(selectedPlan?.perInstallmentCents ?? 0)}
                  </p>
                  {originalMonthlyCents > (selectedPlan?.perInstallmentCents ?? 0) && (
                    <p className="text-xl text-muted-foreground line-through">{formatBRLFromCents(originalMonthlyCents)}</p>
                  )}
                </div>
                <div className="mt-2 rounded-xl bg-[#03EBB1]/15 p-2.5">
                  <p className="text-xs font-semibold text-[#047857]">Pagamento antes do vencimento</p>
                  <p className="text-lg font-bold text-[#047857]">
                    {formatBRLFromCents(selectedPlan?.earlyPaymentPerInstallmentCents ?? 0)}
                    <span className="text-sm font-medium"> /mês</span>
                  </p>
                </div>

                <div className="my-4 border-t" />

                <p className="text-xs md:text-sm font-semibold tracking-[0.08em] text-primary uppercase">Forma de entrada</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {DOWN_PAYMENT_OPTIONS.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedDownPayment(entry.id)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium text-left transition-colors ${
                        selectedDownPayment === entry.id
                          ? "bg-[#0b2a6f] text-white border-[#0b2a6f]"
                          : "bg-white text-primary border-border hover:bg-muted"
                      }`}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>

                <div className="my-4 border-t" />

                <p className="text-xs md:text-sm font-semibold tracking-[0.08em] text-primary uppercase">Escolha o tempo de contrato</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {paymentPlans.map((plan) => (
                    <button
                      key={plan.months}
                      type="button"
                      onClick={() => setSelectedMonths(plan.months)}
                      className={`relative rounded-xl border p-3 text-left transition-colors ${
                        selectedMonths === plan.months
                          ? "bg-[#0b2a6f] text-white border-[#0b2a6f]"
                          : "bg-white text-primary border-border hover:bg-muted"
                      }`}
                    >
                      {plan.months === 6 && (
                        <span className={`absolute -top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          selectedMonths === plan.months ? "bg-[#03EBB1] text-[#064e3b]" : "bg-[#d1fae5] text-[#065f46]"
                        }`}>
                          Mais econômico
                        </span>
                      )}
                      <p className="text-2xl font-bold leading-none">{plan.months} meses</p>
                      <p className={`text-sm mt-1 ${selectedMonths === plan.months ? "text-white/90" : "text-muted-foreground"}`}>
                        {formatBRLFromCents(plan.perInstallmentCents)}/mês
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <Button className="w-full h-12 rounded-xl gap-2 text-base" onClick={() => addCurrentProductToCart()}>
                    <ShoppingCart className="h-4 w-4" />
                    Adicionar ao carrinho ({selectedMonths}x)
                  </Button>
                  <Button
                    className="w-full h-12 rounded-xl text-base font-bold text-primary"
                    style={{ backgroundColor: "#03EBB1" }}
                    onClick={() => addCurrentProductToCart(1)}
                  >
                    Comprar à vista (1x)
                  </Button>
                </div>
              </div>
            </div>
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
                        <article
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(`/produtos/${p.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              navigate(`/produtos/${p.id}`);
                            }
                          }}
                          className="block bg-white rounded-xl p-3 h-full hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label={`Ver detalhes de ${p.name}`}
                        >
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
                        </article>
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
