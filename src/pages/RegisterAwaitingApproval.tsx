import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function RegisterAwaitingApproval() {
  const navigate = useNavigate();
  const [nome, setNome] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      navigate("/login", { replace: true });
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const meta = session.user.user_metadata as { nome_completo?: string };
      setNome(meta?.nome_completo ?? session.user.email ?? null);
    });
  }, [navigate]);

  async function sair() {
    await supabase?.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-card border rounded-lg shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center">
          <Clock className="h-7 w-7 text-warning" />
        </div>
        <h1 className="text-xl font-bold text-primary">Cadastro em análise</h1>
        <p className="text-sm text-muted-foreground">
          {nome ? (
            <>
              Olá, <span className="font-medium text-foreground">{nome}</span>.
            </>
          ) : (
            <>Olá.</>
          )}{" "}
          Seus dados foram recebidos e estão na fila para análise da equipe
          Zavo. Você receberá acesso à área do cliente após a aprovação.
        </p>
        <p className="text-xs text-muted-foreground">
          Sessão ativa com segurança via Supabase (tokens renováveis). Você pode
          sair e entrar novamente com o mesmo e-mail ou nome e senha.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="outline" type="button" onClick={() => void sair()}>
            Sair
          </Button>
          <Button variant="ghost" type="button" asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
