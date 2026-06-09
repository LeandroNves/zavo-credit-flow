import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  CreditCard,
  Smartphone,
  CalendarCheck,
  UserCheck,
  HeartHandshake,
  FileCheck,
  Zap,
  Settings2,
  MessageCircle,
  ArrowRight,
  Shield,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  X as XIcon,
  Instagram,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/Logo-ZAVO-2026.PNG";
import mascote from "@/assets/mascote.png";
import heroImage from "@/assets/IMAGEM-ZAVO-INICIAL.PNG";
import {
  ALL_INSTALLMENTS,
  type LandingProduct,
  calculateInstallmentCents,
  formatBRLFromCents,
  getDefaultProductModel,
  getProductPriceCentsByModel,
  parseProductColors,
} from "@/lib/productsStore";
import { useGlobalLandingProducts } from "@/hooks/useGlobalLandingProducts";
import {
  CART_UPDATED_EVENT,
  type CartItem,
  loadCart,
  makeCartItemId,
  pickDefaultMonths,
  saveCart,
} from "@/lib/cartStore";
import {
  buildCartSnapshot,
  saveRegistrationInterest,
} from "@/lib/registrationInterest";
import { RotatingProductImage } from "@/components/product/RotatingProductImage";
import { toast } from "sonner";

import pixIcon from "@/assets/icon-pix-96.png"
const sacolaZavo = new URL("../assets/Sacola Zavo .PNG", import.meta.url).href;

const PixIcon = ({ className }: { className?: string }) => (
  <img src={pixIcon} alt="Pix" className={className} />
);

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1 px-2">
      <div className="text-xl sm:text-2xl font-bold text-primary-foreground">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-primary-foreground/75">{label}</div>
    </div>
  );
}

/* ─── Intersection Observer fade-in hook ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    const onUpdate = () => setItems(loadCart());
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  };

  return { items, persist };
}

function buildWhatsAppMessage(args: {
  items: CartItem[];
  products: LandingProduct[];
}): string {
  const { items, products } = args;
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: string[] = [];
  lines.push("Olá! Quero finalizar um pedido na Zavo:");
  lines.push("");

  for (const it of items) {
    const p = byId.get(it.productId);
    if (!p) continue;
    const per = calculateInstallmentCents(getProductPriceCentsByModel(p, it.selectedModel), it.months);
    lines.push(
      `- ${it.qty}x ${p.name}${p.color ? ` (${p.color})` : ""} — ${it.months}x de ${formatBRLFromCents(per)}`,
    );
  }

  lines.push("");
  lines.push("Pode me ajudar a concluir?");
  return lines.join("\n");
}

const services = [
  {
    icon: CreditCard,
    title: "Compra facilitada, sem complicação",
    desc: "Soluções pensadas pra quem quer comprar com praticidade, sem processos desnecessários.",
  },
  {
    icon: Smartphone,
    title: "Compra sem cartão",
    desc: "Não depende de limite alto ou aprovação de terceiros. Aqui você tem mais liberdade pra comprar.",
  },
  {
    icon: CalendarCheck,
    title: "Pagamento acessível",
    desc: "Valores ajustados pra caber no seu bolso, com condições claras e previsíveis.",
  },
  {
    icon: UserCheck,
    title: "Condições personalizadas",
    desc: "Cada cliente passa por uma avaliação individual, buscando a melhor forma de viabilizar a compra.",
  },
];

const diferenciais = [
  { icon: HeartHandshake, title: "Atendimento Humanizado", desc: "Você fala com gente de verdade que entende sua situação." },
  { icon: FileCheck, title: "Sem Burocracia", desc: "Processo simplificado, sem papelada infinita." },
  { icon: Zap, title: "Processo Rápido", desc: "Resposta em até 72h úteis após envio dos documentos." },
  { icon: Settings2, title: "Condições Flexíveis", desc: "Parcelamento adaptado à sua realidade financeira." },
];

const diferenciaisExtras = [
  { icon: PixIcon, title: "Pagamentos", desc: "Pagamento por pix ou boleto parcelado" },
  { icon: Shield, title: "Proteção", desc: "Garantia mínima de 3 meses" },
  { icon: Zap, title: "Frete grátis", desc: "Entregamos para todo o Brasil" },
  { icon: MessageCircle, title: "Suporte", desc: "Atendimento humano via WhatsApp" },
];

export default function LandingPage() {
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const products = useGlobalLandingProducts();
  const { items: cartItems, persist: persistCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  const heroRef = useFadeIn();
  const aboutRef = useFadeIn();
  const productsRef = useFadeIn();
  const servicesRef = useFadeIn();
  const compareRef = useFadeIn();
  const diffRef = useFadeIn();
  const ctaRef = useFadeIn();

  const cartCount = cartItems.reduce((sum, it) => sum + it.qty, 0);

  const scrollToHero = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileMenu(false);
    }
  };

  useEffect(() => {
    if (location.hash !== "#produtos") return;
    const timer = window.setTimeout(() => {
      document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const selectedModel = getDefaultProductModel(product);
    const months = pickDefaultMonths(product);
    const colorOptions = parseProductColors(product.color);

    const existingIdx = cartItems.findIndex(
      (it) => it.productId === productId && it.selectedModel === selectedModel && it.months === months,
    );
    if (existingIdx >= 0) {
      const next = cartItems.map((it, i) => (i === existingIdx ? { ...it, qty: Math.min(99, it.qty + 1) } : it));
      persistCart(next);
      setCartOpen(true);
      return;
    }

    const next: CartItem[] = [
      {
        id: makeCartItemId(),
        productId,
        selectedModel,
        dueDay: 10,
        months,
        qty: 1,
        selectedColors: colorOptions.slice(0, 2),
        addedAt: new Date().toISOString(),
      },
      ...cartItems,
    ];
    persistCart(next);
    setCartOpen(true);
  };

  const setQty = (id: string, qty: number) => {
    const q = Math.max(1, Math.min(99, Math.round(qty)));
    persistCart(cartItems.map((it) => (it.id === id ? { ...it, qty: q } : it)));
  };

  const setMonths = (id: string, months: number) => {
    if (![1, 6, 12, 18, 24].includes(months)) return;
    persistCart(cartItems.map((it) => (it.id === id ? { ...it, months: months as any } : it)));
  };

  const setDueDay = (id: string, dueDay: number) => {
    const d = Math.max(1, Math.min(31, Math.round(dueDay)));
    persistCart(cartItems.map((it) => (it.id === id ? { ...it, dueDay: d } : it)));
  };

  const setPreferredColor = (id: string, color: string) => {
    persistCart(
      cartItems.map((it) => {
        if (it.id !== id) return it;
        const alt = it.selectedColors[1] ?? "";
        return { ...it, selectedColors: [color, alt].filter(Boolean) };
      }),
    );
  };

  const setAlternativeColor = (id: string, color: string) => {
    persistCart(
      cartItems.map((it) => {
        if (it.id !== id) return it;
        const pref = it.selectedColors[0] ?? "";
        return { ...it, selectedColors: [pref, color].filter(Boolean) };
      }),
    );
  };

  const removeItem = (id: string) => persistCart(cartItems.filter((it) => it.id !== id));
  const clearCart = () => persistCart([]);

  const goCheckoutCadastro = () => {
    const hasMissingPrice = cartItems.some((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return true;
      return getProductPriceCentsByModel(p, it.selectedModel) <= 0;
    });
    if (hasMissingPrice) {
      // Não prossegue sem preço configurado para não gerar parcelas inválidas
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
      cart: buildCartSnapshot({ cartItems, products }),
    });
    setCartOpen(false);
    navigate("/cadastro");
  };

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link
            to="/"
            onClick={scrollToHero}
            className="flex h-full items-center shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Voltar ao início"
          >
            <img src={logo} alt="Zavo" className="h-11 md:h-12 w-auto object-contain" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <a href="#sobre" className="hover:text-secondary transition-colors">Sobre</a>
            <Link to="/produtos" className="hover:text-secondary transition-colors">Produtos</Link>
            <a href="#servicos" className="hover:text-secondary transition-colors">Serviços</a>
            <a href="#diferenciais" className="hover:text-secondary transition-colors">Diferenciais</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">Entrar</Button>
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Abrir carrinho"
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

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-3 animate-fade-in">
            <a href="#sobre" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Sobre</a>
            <a href="#produtos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Produtos</a>
            <Link to="/produtos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Ver todos</Link>
            <a href="#servicos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Serviços</a>
            <a href="#diferenciais" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Diferenciais</a>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login"><Button variant="outline" className="w-full">Entrar</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── CART SHEET ─── */}
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
                    const missingColors = colorOptions.length >= 2
                      ? !preferred || !alternative || preferred === alternative
                      : !preferred || !alternative;
                    const per = calculateInstallmentCents(getProductPriceCentsByModel(p, it.selectedModel), it.months);
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

      {/* ─── HERO ─── */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-gradient-to-br from-white via-background to-accent/30"
      >
        <div
          ref={heroRef}
          className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-8 md:pt-6 md:pb-10 lg:pt-8 lg:pb-14 flex flex-col md:flex-row items-center gap-5 md:gap-8 lg:gap-12"
        >
          <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
              <Zap className="h-3.5 w-3.5" /> Novidade disponível!
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-[1.1] tracking-tight">
              Tenha seu iPhone{" "}
              <span className="text-secondary">de forma simples</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Acesse a linha completa de iPhones com parcelamento que cabe no seu bolso. Sem cartão, sem complicação.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <a href="/produtos">
                <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                  Ver modelos <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-accent/20 rounded-full blur-3xl scale-75" />
            <img
              src={heroImage}
              alt="Zavo — crédito e eletrônicos"
              className="relative w-full max-w-sm md:max-w-md lg:max-w-lg drop-shadow-2xl object-contain"
            />
          </div>
        </div>
      </section>

      {/* ─── SOBRE ─── */}
      <section id="sobre" className="py-20 lg:py-28 bg-white">
        <div ref={aboutRef} className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Sobre a Zavo</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary leading-tight">
                Acesso facilitado para quem quer comprar de verdade
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A Zavo acredita no potencial de cada pessoa. Sabemos que nem todo mundo se encaixa nos modelos tradicionais de compra — seja pela forma de renda, histórico ou exigências que acabam dificultando o acesso. Por isso, criamos um formato mais simples e direto: analisamos cada caso de forma individual, com atendimento próximo e opções de pagamento que se adaptam à realidade de cada cliente.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Aqui, o foco não é burocracia. É viabilizar sua compra de forma justa, clara e possível.
              </p>
              <Link to="/cadastro">
                <Button variant="outline" className="rounded-full gap-2 mt-2">
                  Saiba mais <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-accent/40 to-secondary/10 rounded-3xl blur-2xl" />
                <img
                  src={mascote}
                  alt="Mascote Zavo"
                  className="relative w-56 lg:w-72 drop-shadow-lg"
                  loading="lazy"
                  width={1024}
                  height={1024}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUTOS ─── */}
      <section id="produtos" className="py-20 lg:py-28 bg-background/50">
        <div ref={productsRef} className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Linha completa</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mt-3">Produtos mais procurados</h2>
          </div>

          <Carousel
            opts={{ align: "start", loop: true }}
            className="max-w-6xl mx-auto"
          >
            <CarouselContent>
              {products.map((p) => {
                const months = (p.enabledMonths?.length ? p.enabledMonths : ALL_INSTALLMENTS).slice().sort((a, b) => a - b);
                return (
                  <CarouselItem key={p.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="group bg-white rounded-2xl p-8 border border-border/50 hover:shadow-xl hover:border-secondary/30 transition-all duration-300 text-center h-full">
                      <div className="h-56 flex items-center justify-center mb-6">
                        <RotatingProductImage
                          images={p.imageSrcs?.length ? p.imageSrcs : [p.imageSrc]}
                          alt={p.name}
                          containerClassName="h-48 w-full"
                          intervalMs={2500}
                        />
                      </div>
                      <h3 className="text-lg font-bold text-primary">{p.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{p.color}</p>

                      <div className="mt-5 space-y-1.5">
                        {months.map((m) => {
                          const per = calculateInstallmentCents(p.priceCents, m);
                          // se o admin ainda não preencheu preço, evita mostrar "R$ 0,00"
                          if (!p.priceCents) return null;
                          return (
                            <div key={m} className="text-sm text-muted-foreground">
                              <span className="font-semibold text-primary">{m}x</span>{" "}
                              de{" "}
                              <span className="font-semibold text-primary">
                                {formatBRLFromCents(per)}
                              </span>
                            </div>
                          );
                        })}
                        {!p.priceCents && (
                          <div className="text-sm text-muted-foreground">
                            Consulte condições pelo WhatsApp.
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <Button
                          className="rounded-full w-full"
                          onClick={() => addToCart(p.id)}
                        >
                          <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />

            {/* Mobile controls (precisam ficar dentro do Carousel) */}
            <CarouselPrevious className="md:hidden left-3 top-full mt-6 translate-y-0" />
            <CarouselNext className="md:hidden right-3 top-full mt-6 translate-y-0" />
          </Carousel>

          <div className="text-center mt-12">
            <Link to="/produtos">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                Mostrar todos os produtos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── COMPARATIVO (inspirado imagem 5) ─── */}
      <section className="py-20 lg:py-28 bg-white">
        <div ref={compareRef} className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Por que parcelar?</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mt-3">
              Comprar do seu jeito é melhor do que se limitar as
              <br className="hidden sm:block" />
              opções tradicionais
            </h2>
          </div>

          <div className="space-y-4">
            {/* Comprar na loja */}
            <div className="rounded-2xl border border-border/60 bg-white p-6 lg:p-8">
              <h3 className="font-bold text-primary text-lg mb-4">Comprar na loja tradicional</h3>
              <div className="space-y-2.5">
                {[
                  "Depende de limite disponível no cartão",
                  "Exige pagamento alto de uma vez",
                  "Pouca flexibilidade na forma de pagamento",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alugar */}
            <div className="rounded-2xl border border-border/60 bg-white p-6 lg:p-8">
              <h3 className="font-bold text-primary text-lg mb-4">Alugar mensalmente</h3>
              <div className="space-y-2.5">
                {[
                  "Você paga por algo que não será seu",
                  "Regras, limites e taxas ao cancelar",
                  "Trocas não geram aproveitamento do valor",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zavo */}
            <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-6 lg:p-8 text-primary-foreground shadow-lg">
              <h3 className="font-bold text-lg mb-4">Comprar com a Zavo</h3>
              <div className="space-y-2.5">
                {[
                  "Parcelas que cabem no seu bolso",
                  "O produto é seu ao finalizar o pagamento",
                  "Você mantém seu dinheiro organizado",
                  "Condições adaptadas ao seu perfil",
                  "Possibilidade de troca com aproveitamento",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm opacity-90">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVIÇOS ─── */}
      <section id="servicos" className="py-20 lg:py-28 bg-background/50">
        <div ref={servicesRef} className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Nossos serviços</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mt-3">Como a Zavo te ajuda</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-7 border border-border/50 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-5">
                  <s.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-bold text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIFERENCIAIS ─── */}
      <section id="diferenciais" className="py-20 lg:py-28 bg-white">
        <div ref={diffRef} className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Diferenciais</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mt-3">Por que escolher a Zavo?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...diferenciais, ...diferenciaisExtras].map((d) => (
              <div key={d.title} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-accent/60 flex items-center justify-center mx-auto mb-5 group-hover:bg-secondary/15 transition-colors duration-300">
                  <d.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-primary mb-2">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary to-secondary">
        <div ref={ctaRef} className="max-w-3xl mx-auto px-4 lg:px-8 text-center space-y-8">
          <img src={mascote} alt="Mascote Zavo" className="w-20 mx-auto drop-shadow-lg" loading="lazy" width={1024} height={1024} />
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight">
            Pronto para adquirir seu produto com a Zavo?
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto text-lg">
            Entre em contato agora e tire suas dúvidas. Estamos prontos para ajudar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/5562994356950" target="_blank" rel="noreferrer">
              <Button size="lg" variant="secondary" className="rounded-full gap-2 px-8 w-full sm:w-auto">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <Link to="/cadastro">
              <Button
                size="lg"
                variant="outline"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-full px-8 w-full sm:w-auto"
              >
                Fazer cadastro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── MÉTRICAS ─── */}
      <section className="py-12 lg:py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground border border-border/20 shadow-lg px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">A Zavo é confiável</p>
                  <p className="text-sm text-primary-foreground/75">
                    Processo seguro e foco em viabilizar sua compra.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <StatItem value="+ 2 mil" label="Vendas realizadas" />
                <StatItem value="4.9/5" label="Avaliação das compras" />
                <StatItem value="100%" label="Seguro e transparente" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA SECUNDÁRIO ─── */}
      <section className="pb-12 lg:pb-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="rounded-2xl bg-accent/70 border border-border/30 shadow-sm px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <h3 className="text-2xl lg:text-3xl font-bold text-primary leading-tight">
                  Pronto para ter o seu?
                </h3>
                <p className="text-muted-foreground">
                  Simule agora e descubra como e facil comprar do seu jeito com a Zavo.
                </p>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <a href="#produtos">
                  <Button
                    size="lg"
                    className="rounded-full px-8 gap-2 whitespace-nowrap"
                  >
                    Simule agora <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <img
                  src={sacolaZavo}
                  alt="Sacola Zavo"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
                  loading="lazy"
                  width={1024}
                  height={1024}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <Link to="/" onClick={scrollToHero} className="inline-block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <img src={logo} alt="Zavo" className="h-24 md:h-28 w-auto object-contain" />
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Seu eletrônico, do seu jeito de pagar
              </p>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.instagram.com/zavo.oficial"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram da Zavo"
                  className="w-[3.15rem] h-[3.15rem] rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-secondary transition-colors"
                >
                  <Instagram className="h-[1.4rem] w-[1.4rem]" strokeWidth={1.75} />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-primary text-sm mb-4">Sobre Nós</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p className="hover:text-secondary cursor-pointer transition-colors">Quem somos</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-primary text-sm mb-4">Segurança</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p className="hover:text-secondary cursor-pointer transition-colors">Termos de uso</p>
                <p className="hover:text-secondary cursor-pointer transition-colors">Proteção de dados</p>
                <p className="hover:text-secondary cursor-pointer transition-colors">Política de privacidade</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-primary text-sm mb-4">Contato</h4>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p>zavooficial@gmail.com</p>
                <p>WhatsApp: (62) 99435-6950</p>
                <p className="pt-2 text-xs">CNPJ: 54.474.185/0001-03</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 text-center text-xs text-muted-foreground">
            © 2026 Zavo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
