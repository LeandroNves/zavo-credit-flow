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
  Shield,
  Truck,
  Zap,
  Headphones,
  Lock,
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
  cartItemHasValidColorSelection,
  formatBRLFromCents,
  getDefaultProductModel,
  getInitialCartColorsForProduct,
  getProductModelOptions,
  getProductPriceCentsByModel,
  parseProductColors,
  productRequiresTwoColorChoices,
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
import {
  ProductPaymentPanel,
  ProductPaymentStickyBar,
} from "@/components/product/ProductPaymentPanel";
import { toast } from "sonner";
import logo from "@/assets/logo-zavo-2026.png";
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
    setSelectedMonths(product ? pickDefaultMonths(product) : 6);
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

  const setDueDay = (id: string, dueDay: number) => {
    const d = Math.max(1, Math.min(31, Math.round(dueDay)));
    const next = cartItems.map((it) => (it.id === id ? { ...it, dueDay: d } : it));
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
      return !cartItemHasValidColorSelection(p, it.selectedColors);
    });
    if (hasMissingColors) {
      setCartOpen(true);
      toast.error("Selecione as cores necessárias para cada produto no carrinho.");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
  const visibleMonths = (product.enabledMonths?.length ? product.enabledMonths : ALL_INSTALLMENTS)
    .slice()
    .sort((a, b) => a - b);
  const effectiveSelectedMonths = visibleMonths.includes(selectedMonths)
    ? selectedMonths
    : ((visibleMonths[0] ?? 6) as InstallmentMonths);
  const paymentPlans = visibleMonths.map((months) => {
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
  const addCurrentProductToCart = (forcedMonths?: 1 | 6 | 12 | 18 | 24) => {
    const months = forcedMonths ?? effectiveSelectedMonths ?? pickDefaultMonths(product);
    const effectiveModel = selectedModel || getDefaultProductModel(product);
    const effectiveDownPayment: DownPaymentOptionId =
      forcedMonths === 1 ? "none" : selectedDownPayment;
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
        dueDay: 10,
        months: months as 1 | 6 | 12 | 18 | 24,
        qty: 1,
        selectedColors: getInitialCartColorsForProduct(product),
        addedAt: new Date().toISOString(),
      },
      ...current,
    ];
    saveCart(next);
    setCartItems(next);
    setCartOpen(true);
    toast.success("Produto adicionado ao carrinho.");
  };

  const trustItems = [
    { icon: Shield, text: "Seu produto é seu desde o início" },
    { icon: Zap, text: "Processo simples, rápido e 100% online" },
    { icon: Headphones, text: "Atendimento próximo e humanizado" },
    { icon: Lock, text: "Compra segura e protegida" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 md:h-16 px-3 md:px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Zavo" className="h-16 md:h-32" />
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
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">
                Entrar
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <Link to="/login">
              <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs">
                Entrar
              </Button>
            </Link>
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
                    const dueDay = Math.max(1, Math.min(31, Math.round(it.dueDay ?? 10)));
                    const missingColors =
                      productRequiresTwoColorChoices(p) &&
                      !cartItemHasValidColorSelection(p, it.selectedColors);
                    const per = calculateInstallmentWithDownPaymentCents({
                      priceCents: getProductPriceCentsByModel(p, it.selectedModel),
                      months: it.months,
                      downPaymentOptionId: it.selectedDownPayment ?? "none",
                    }).perInstallmentCents;
                    return (
                      <div key={it.id} className="border rounded-xl p-3 bg-white">
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

                            <div className="mt-3 grid grid-cols-3 gap-2 items-center">
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
                                <p className="text-xs text-muted-foreground mb-1">Venc.</p>
                                <Select value={String(dueDay)} onValueChange={(v) => setDueDay(it.id, Number(v))}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                      <SelectItem key={`due-${it.id}-${d}`} value={String(d)}>
                                        {String(d).padStart(2, "0")}
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

                            {productRequiresTwoColorChoices(p) ? (
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
                            ) : (
                              <p className="mt-3 text-xs text-muted-foreground">
                                Cor: <span className="font-medium text-primary">{p.color}</span>
                              </p>
                            )}
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
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-secondary text-secondary"
                    onClick={() => setCartOpen(false)}
                  >
                    Continuar comprando
                  </Button>
                  <Button variant="ghost" className="w-full rounded-full text-muted-foreground" onClick={clearCart}>
                    Limpar carrinho
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <main className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-4 md:py-8">
        <div className="space-y-3 md:space-y-6">
          <div className="flex items-center">
            <Button asChild variant="ghost" size="sm" className="gap-2 h-8 text-xs md:text-sm md:h-9">
              <Link to="/produtos">
                <ArrowLeft className="h-4 w-4" />
                Voltar para produtos
              </Link>
            </Button>
          </div>

          <section className="p-0 md:p-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm border border-border/40">
              <div className="space-y-2 md:space-y-3">
                <div className="rounded-lg md:rounded-xl bg-white min-h-[160px] md:min-h-[280px] flex items-center justify-center p-2 md:p-4 border border-border/30">
                  {mainImage && (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="max-h-[160px] md:max-h-[340px] object-contain"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 overflow-auto pb-0.5">
                  {images.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setMainImageIndex(idx)}
                      className={`w-11 h-11 md:w-14 md:h-14 rounded-md md:rounded-lg overflow-hidden bg-white flex-shrink-0 border-2 transition-all ${
                        idx === mainImageIndex
                          ? "border-secondary ring-2 ring-secondary/20"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 md:space-y-5">
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-primary leading-tight">{product.name}</h1>
                  {selectedModel && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{selectedModel}</p>
                  )}
                </div>

                {!!getProductModelOptions(product).length && (
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-primary mb-1.5 md:mb-2">Modelo</p>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {getProductModelOptions(product).map((opt) => (
                        <Button
                          key={`${product.id}-${opt.model}`}
                          type="button"
                          size="sm"
                          variant={selectedModel === opt.model ? "default" : "outline"}
                          className={`rounded-full px-3 h-8 text-xs md:px-4 md:h-9 md:text-sm ${
                            selectedModel !== opt.model ? "border-secondary/40 text-primary hover:bg-secondary/5" : ""
                          }`}
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
                    <p className="text-xs md:text-sm font-semibold text-primary mb-1.5 md:mb-2">Cores</p>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {colors.map((color, idx) => (
                        <Button
                          key={`${product.id}-${color}-${idx}`}
                          type="button"
                          size="sm"
                          variant={idx === mainImageIndex ? "default" : "outline"}
                          className={`rounded-full px-3 h-8 text-xs md:px-4 md:h-9 md:text-sm ${
                            idx !== mainImageIndex ? "border-secondary/40 text-primary hover:bg-secondary/5" : ""
                          }`}
                          onClick={() => setMainImageIndex(Math.min(idx, images.length - 1))}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!!product.deliveryTime && (
                  <div className="flex items-start gap-2 rounded-lg md:rounded-xl border border-border/50 bg-muted/30 px-2.5 py-2 md:px-3 md:py-2.5">
                    <Truck className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm font-medium text-primary">Entrega para todo o Brasil</p>
                      <p className="text-[11px] md:text-xs text-muted-foreground">{product.deliveryTime}</p>
                    </div>
                  </div>
                )}

                {!!product.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed hidden md:block">
                    {product.description}
                  </p>
                )}

                <ProductPaymentPanel
                  paymentPlans={paymentPlans}
                  selectedMonths={effectiveSelectedMonths}
                  onSelectMonths={setSelectedMonths}
                  selectedDownPayment={selectedDownPayment}
                  onSelectDownPayment={setSelectedDownPayment}
                  onAddToCart={() => addCurrentProductToCart()}
                />

                <div className="hidden md:grid grid-cols-2 gap-2">
                  {trustItems.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-2 py-3 text-center"
                    >
                      <Icon className="h-4 w-4 text-secondary" />
                      <span className="text-[11px] font-medium text-primary leading-snug">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <ProductPaymentStickyBar onAddToCart={() => addCurrentProductToCart()} />

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
                              <p className="text-2xl font-bold text-secondary leading-none mt-1">{formatBRLFromCents(per6)}</p>
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

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-primary via-secondary to-secondary text-primary-foreground p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm shadow-lg">
                {[
                  "Parcela que cabe no seu bolso",
                  "Desconto por pagamento em dia",
                  "Seu eletrônico, do seu jeito de pagar",
                  "Compra segura e transparente",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Shield className="h-5 w-5 text-primary-foreground/80 flex-shrink-0" />
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
