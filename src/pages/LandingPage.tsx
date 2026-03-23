import { Link } from "react-router-dom";
import { CreditCard, Smartphone, CalendarCheck, UserCheck, HeartHandshake, FileCheck, Zap, Settings2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import mascote from "@/assets/mascote.png";

const services = [
  { icon: CreditCard, title: "Crédito Facilitado", desc: "Soluções de crédito para quem precisa, sem burocracia desnecessária." },
  { icon: Smartphone, title: "Venda de Eletrônicos", desc: "Smartphones e eletrônicos com parcelamento acessível." },
  { icon: CalendarCheck, title: "Parcelamento Simplificado", desc: "Parcelas que cabem no seu bolso, sem complicação." },
  { icon: UserCheck, title: "Análise Individual", desc: "Cada cliente é analisado de forma personalizada." },
];

const diferenciais = [
  { icon: HeartHandshake, title: "Atendimento Humanizado", desc: "Você fala com gente de verdade que entende sua situação." },
  { icon: FileCheck, title: "Sem Burocracia", desc: "Processo simplificado, sem papelada infinita." },
  { icon: Zap, title: "Processo Rápido", desc: "Resposta em até 72h úteis após envio dos documentos." },
  { icon: Settings2, title: "Condições Flexíveis", desc: "Parcelamento adaptado à sua realidade financeira." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Zavo" className="h-8" />
            <img src={mascote} alt="Mascote Zavo" className="h-10 -ml-1" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground">
            <a href="#sobre" className="hover:text-secondary transition-colors">Sobre</a>
            <a href="#servicos" className="hover:text-secondary transition-colors">Serviços</a>
            <a href="#diferenciais" className="hover:text-secondary transition-colors">Diferenciais</a>
          </div>
          <Link to="/login">
            <Button variant="default" size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight">
              Zavo, crédito que funciona para você!
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              A Zavo nasceu para ajudar quem não consegue crédito em banco. Oferecemos soluções reais para pessoas reais, com análise humanizada e condições que cabem no seu bolso.
            </p>
            <p className="text-base font-medium text-secondary">
              Sem cartão? Nome negativado? A gente encontra uma solução possível pra você.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/cadastro">
                <Button size="lg" className="w-full sm:w-auto">Solicitar Análise</Button>
              </Link>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <MessageCircle className="h-4 w-4" /> Falar com Especialista
                </Button>
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src={mascote} alt="Mascote Zavo" className="w-64 md:w-80 lg:w-96 drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 bg-card">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
          <h2 className="text-3xl font-bold text-primary">Sobre a Zavo</h2>
          <p className="text-muted-foreground leading-relaxed">
            A Zavo é uma empresa de crédito alternativo que acredita no potencial de cada pessoa. Sabemos que muitos brasileiros enfrentam dificuldades para obter crédito em bancos tradicionais — seja por restrição no nome, falta de comprovação de renda ou simplesmente por não se encaixarem nos critérios rígidos do mercado. Por isso, criamos um modelo baseado em análise individual, com atendimento humanizado e condições flexíveis que realmente funcionam.
          </p>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">Nossos Serviços</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <s.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-primary text-center mb-12">Por que a Zavo?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {diferenciais.map((d) => (
              <div key={d.title} className="text-center p-6">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                  <d.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-primary mb-2">{d.title}</h3>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-6">
          <img src={mascote} alt="Mascote Zavo" className="w-24 mx-auto" />
          <h2 className="text-3xl font-bold">Pronto para conseguir seu crédito?</h2>
          <p className="max-w-md mx-auto opacity-90">
            Entre em contato agora ou solicite sua análise. Estamos prontos para ajudar!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <Link to="/cadastro">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto">
                Solicitar Análise
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary py-10 text-primary-foreground/80 text-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src={logo} alt="Zavo" className="h-8 mb-3 brightness-0 invert" />
              <p>Crédito alternativo para quem precisa.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-foreground mb-2">Contato</h4>
              <p>CNPJ: 12.345.678/0001-90</p>
              <p>Tel: (11) 3000-1234</p>
              <p>contato@zavo.com.br</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-foreground mb-2">Legal</h4>
              <p className="cursor-pointer hover:underline">Termos de Uso</p>
              <p className="cursor-pointer hover:underline">Política de Privacidade</p>
              <p className="cursor-pointer hover:underline">Política de Cookies</p>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center">
            © 2026 Zavo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
