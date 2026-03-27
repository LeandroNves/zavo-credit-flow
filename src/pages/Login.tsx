import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setClienteAtualId } from "@/lib/clienteSession";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function Login() {
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleEntrar() {
    if (!isSupabaseConfigured || !supabase) {
      setClienteAtualId("1");
      navigate("/cliente");
      return;
    }

    const raw = identificador.trim();
    if (!raw || !senha) {
      toast.error("Preencha nome ou e-mail e a senha.");
      return;
    }

    setLoading(true);
    try {
      let email = raw;
      if (!raw.includes("@")) {
        const { data, error } = await supabase.rpc("lookup_email_for_login", {
          p_identifier: raw,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data === "__AMBIGUOUS__") {
          toast.error(
            "Vários cadastros com esse nome. Use o e-mail cadastrado para entrar.",
          );
          return;
        }
        if (!data) {
          toast.error("Cadastro não encontrado. Verifique nome ou e-mail.");
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
            Acesse sua conta
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Use o <strong className="text-foreground">e-mail do cadastro</strong> ou o{" "}
            <strong className="text-foreground">nome completo</strong> (se for único).
            A senha é armazenada com segurança pelo Supabase Auth (hash no servidor).
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ident">E-mail ou nome completo</Label>
              <Input
                id="ident"
                placeholder="seu@email.com ou Maria Silva"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
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
              onClick={() => navigate("/admin")}
            >
              Entrar como Admin
            </Button>
          </div>
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
