import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setClienteAtualId } from "@/lib/clienteSession";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { validatePortalPassword } from "@/lib/clientPasswordPolicy";
import { formatCPF, normalizeCPF } from "@/lib/brFormat";

export default function Login() {
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const s = window.location.search || "";
    const h = window.location.hash || "";
    const hasRecovery = s.includes("type=recovery") || h.includes("type=recovery");
    setRecoveryMode(hasRecovery);
  }, []);

  async function handleEntrar() {
    if (!isSupabaseConfigured || !supabase) {
      setClienteAtualId("1");
      navigate("/cliente");
      return;
    }

    const raw = identificador.trim();
    if (!raw || !senha) {
      toast.error("Preencha CPF ou e-mail e a senha.");
      return;
    }

    setLoading(true);
    try {
      let email = raw;
      if (!raw.includes("@")) {
        const cpfDigits = normalizeCPF(raw);
        if (cpfDigits.length !== 11) {
          toast.error("CPF inválido. Digite o CPF completo ou use o e-mail.");
          return;
        }
        const { data, error } = await supabase.rpc("lookup_email_for_login", {
          p_identifier: cpfDigits,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!data) {
          toast.error("Cadastro não encontrado. Verifique CPF ou e-mail.");
          return;
        }
        email = data as string;
      } else {
        email = raw.toLowerCase();
      }

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (signErr) {
        toast.error("E-mail ou senha incorretos.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sessão inválida. Tente novamente.");
        return;
      }

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select(
          "registration_status, linked_client_id",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (pErr || !profile) {
        toast.error("Perfil não encontrado. Conclua o cadastro ou contate o suporte.");
        await supabase.auth.signOut();
        return;
      }

      if (profile.registration_status === "rejected") {
        toast.error("Seu cadastro não foi aprovado.");
        await supabase.auth.signOut();
        return;
      }

      if (profile.registration_status === "pending") {
        navigate("/cadastro/aguardando");
        return;
      }

      if (!profile.linked_client_id) {
        toast.error(
          "Sua conta foi aprovada, mas ainda não está vinculada. Contate o suporte.",
        );
        return;
      }

      setClienteAtualId(profile.linked_client_id);
      navigate("/cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleRedefinirSenha() {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Supabase não configurado para redefinir senha.");
      return;
    }
    const err = validatePortalPassword(novaSenha);
    if (err) {
      toast.error(err);
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      toast.error("A confirmação da senha não confere.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Senha redefinida com sucesso. Faça login com a nova senha.");
      await supabase.auth.signOut();
      setNovaSenha("");
      setConfirmarNovaSenha("");
      setRecoveryMode(false);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 md:left-8 md:top-8"
        type="button"
        onClick={() => navigate("/")}
        aria-label="Voltar para a landing page"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8" />
        <div className="bg-card rounded-lg shadow-sm border p-8 space-y-6">
          <h1 className="text-2xl font-bold text-primary text-center">
            {recoveryMode ? "Redefinir senha" : "Acesse sua conta"}
          </h1>
          {!recoveryMode ? (
            <p className="text-sm text-muted-foreground text-center">
              Use o <strong className="text-foreground">CPF</strong> ou o{" "}
              <strong className="text-foreground">e-mail do cadastro</strong>.
              A senha é armazenada com segurança pelo Supabase Auth (hash no servidor).
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Defina sua nova senha de acesso.
            </p>
          )}
          {!recoveryMode ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ident">CPF ou e-mail</Label>
                  <Input
                    id="ident"
                    placeholder="000.000.000-00 ou seu@email.com"
                    value={identificador}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next.includes("@")) setIdentificador(next);
                      else setIdentificador(formatCPF(next));
                    }}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  type="button"
                  disabled={loading}
                  onClick={() => void handleEntrar()}
                >
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => navigate("/admin/login")}
                >
                  Entrar como Admin
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    placeholder="Nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-nova-senha">Confirmar nova senha</Label>
                  <Input
                    id="confirmar-nova-senha"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                type="button"
                disabled={loading}
                onClick={() => void handleRedefinirSenha()}
              >
                {loading ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              className="text-secondary font-medium hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
