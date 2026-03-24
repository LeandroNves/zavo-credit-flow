import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import mascote from "@/assets/mascote.png";
import heroIphone from "@/assets/iphone17azul.png";
import iphone17Digital from "@/assets/iPhone-17-Digital-PNG.png";
import iphone17Enhanced from "@/assets/iPhone-17-Enhanced-Audio-Quality-PNG.png";
import iphone17Branco from "@/assets/iphone17branco.png";

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

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [isVisible]);

  return { ref, isVisible };
}

const products = [
  { name: "iPhone 17 Pro max", img: iphone17Digital, color: "Laranja" },
  { name: "iPhone 17", img: iphone17Enhanced, color: "Titânio Azul" },
  { name: "iPhone 17 Pro Max", img: iphone17Branco, color: "Titânio Branco" },
];

const services = [
  { icon: CreditCard, title: "Crédito Facilitado", desc: "Soluções de crédito para quem precisa, sem burocracia desnecessária." },
  { icon: Smartphone, title: "Compra sem Cartão", desc: "Não precisa de cartão de crédito nem limite alto. A gente resolve." },
  { icon: CalendarCheck, title: "Parcelamento Acessível", desc: "Parcelas que cabem no seu bolso, com condições reais." },
  { icon: UserCheck, title: "Análise Personalizada", desc: "Cada cliente é analisado de forma individual e humanizada." },
];

const diferenciais = [
  { icon: HeartHandshake, title: "Atendimento Humanizado", desc: "Você fala com gente de verdade que entende sua situação." },
  { icon: FileCheck, title: "Sem Burocracia", desc: "Processo simplificado, sem papelada infinita." },
  { icon: Zap, title: "Processo Rápido", desc: "Resposta em até 72h úteis após envio dos documentos." },
  { icon: Settings2, title: "Condições Flexíveis", desc: "Parcelamento adaptado à sua realidade financeira." },
];

const diferenciaisExtras = [
  { icon: CreditCard, title: "Pagamentos", desc: "Parcelamento recorrente sem ocupar limite" },
  { icon: Shield, title: "Proteção", desc: "Cobertura contra danos e imprevistos" },
  { icon: Zap, title: "Frete grátis", desc: "Entregamos para todo o Brasil" },
  { icon: MessageCircle, title: "Suporte", desc: "Atendimento humano via WhatsApp" },
];

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroRef = useFadeIn();
  const aboutRef = useFadeIn();
  const productsRef = useFadeIn();
  const servicesRef = useFadeIn();
  const compareRef = useFadeIn();
  const diffRef = useFadeIn();
  const ctaRef = useFadeIn();
  const { ref: diffCardsRef, isVisible: diffCardsVisible } = useInViewOnce<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Zavo" className="h-36" />
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <a href="#sobre" className="hover:text-secondary transition-colors">Sobre</a>
            <a href="#produtos" className="hover:text-secondary transition-colors">Produtos</a>
            <a href="#servicos" className="hover:text-secondary transition-colors">Serviços</a>
            <a href="#diferenciais" className="hover:text-secondary transition-colors">Diferenciais</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="rounded-full px-6">Solicitar Análise</Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-3 animate-fade-in">
            <a href="#sobre" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Sobre</a>
            <a href="#produtos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Produtos</a>
            <a href="#servicos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Serviços</a>
            <a href="#diferenciais" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Diferenciais</a>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login"><Button variant="outline" className="w-full">Entrar</Button></Link>
              <Link to="/cadastro"><Button className="w-full">Solicitar Análise</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-background to-accent/30">
        <div ref={heroRef} className="max-w-7xl mx-auto px-4 lg:px-8 py-16 md:py-12 lg:py-32 flex flex-col md:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 space-y-6 text-center md:text-left">
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
              <a href="#produtos">
                <Button size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
                  Ver modelos <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/cadastro">
                <Button size="lg" variant="outline" className="rounded-full px-8 w-full sm:w-auto">
                  Solicitar análise
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-accent/20 rounded-full blur-3xl scale-75" />
            <img
              src={heroIphone}
              alt="iPhone 17 Pro"
              className="relative w-[22.464rem] md:w-[24.96rem] lg:w-[32.76rem] drop-shadow-2xl"
              width={1024}
              height={1024}
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
                Crédito alternativo para quem realmente precisa
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A Zavo é uma empresa que acredita no potencial de cada pessoa. Sabemos que muitos brasileiros enfrentam dificuldades para obter crédito em bancos tradicionais — seja por restrição no nome, falta de comprovação de renda ou critérios rígidos do mercado.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Por isso, criamos um modelo baseado em análise individual, com atendimento humanizado e condições flexíveis que realmente funcionam.
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

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-3 gap-8">
            {products.map((p) => (
              <div
                key={p.name}
                className="group bg-white rounded-2xl p-8 border border-border/50 hover:shadow-xl hover:border-secondary/30 transition-all duration-300 text-center"
              >
                <div className="h-56 flex items-center justify-center mb-6">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-48 object-contain group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={600}
                    height={800}
                  />
                </div>
                <h3 className="text-lg font-bold text-primary">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.color}</p>
              </div>
            ))}
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {products.map((p) => (
                    <div key={p.name} className="w-full flex-shrink-0 px-4">
                      <div className="bg-white rounded-2xl p-8 border border-border/50 text-center">
                        <div className="h-48 flex items-center justify-center mb-4">
                          <img src={p.img} alt={p.name} className="h-40 object-contain" loading="lazy" width={600} height={800} />
                        </div>
                        <h3 className="text-lg font-bold text-primary">{p.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{p.color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {products.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentSlide ? "bg-secondary" : "bg-border"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/cadastro">
              <Button variant="outline" className="rounded-full gap-2 px-8">
                Ver produtos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── COMPARATIVO (inspirado imagem 5) ─── */}
      <section className="py-20 lg:py-28 bg-white">
        <div ref={compareRef} className="max-w-4xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Por que financiar?</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mt-3">
              <span className="text-secondary">Financiar</span> é a solução para não{" "}
              <br className="hidden sm:block" />
              alugar e não comprar à vista
            </h2>
          </div>

          <div className="space-y-4">
            {/* Comprar na loja */}
            <div className="rounded-2xl border border-border/60 bg-white p-6 lg:p-8">
              <h3 className="font-bold text-primary text-lg mb-4">Comprar na Loja</h3>
              <div className="space-y-2.5">
                {[
                  "Precisa de limite alto no cartão (perderá ele)",
                  "Precisa do valor total à vista (descapitalização)",
                  "Economia mínima comparado às parcelas financiadas",
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
                  "Paga por um bem que não será seu",
                  "Limite de uso, regras e multa por cancelamento",
                  "Ao trocar por modelo novo, não abate nada",
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
              <h3 className="font-bold text-lg mb-4">Financiar na Zavo</h3>
              <div className="space-y-2.5">
                {[
                  "Parcela acessível e previsível",
                  "Você paga um bem que será seu",
                  "Preserva seu caixa sem descapitalizar",
                  "Possibilidade de antecipar parcelas",
                  "Ao finalizar e decidir trocar, seu bem tem valor na troca",
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
          <div ref={diffCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...diferenciais, ...diferenciaisExtras].map((d, index) => (
              <div
                key={d.title}
                className="text-center group transition-all duration-700 ease-out will-change-transform"
                style={{
                  transitionDelay: `${index * 90}ms`,
                  opacity: diffCardsVisible ? 1 : 0,
                  transform: diffCardsVisible ? "translateY(0)" : "translateY(18px)",
                }}
              >
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
            Pronto para ter seu iPhone?
          </h2>
          <p className="text-primary-foreground/80 max-w-md mx-auto text-lg">
            Entre em contato agora ou solicite sua análise. Estamos prontos para ajudar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
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
                Solicitar Análise
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="md:col-span-2 space-y-4">
              <img src={logo} alt="Zavo" className="h-32" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Crédito alternativo para quem precisa. Acesso a tecnologia com parcelamento acessível e análise humanizada.
              </p>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.instagram.com/"
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
                <p>contato@zavo.com.br</p>
                <p>(11) 3000-1234</p>
                <p>WhatsApp: (11) 99999-9999</p>
                <p className="pt-2 text-xs">CNPJ: 12.345.678/0001-90</p>
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

      {/* ─── WhatsApp FAB ─── */}
      <a
        href="https://wa.me/5511999999999"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </a>
    </div>
  );
}
