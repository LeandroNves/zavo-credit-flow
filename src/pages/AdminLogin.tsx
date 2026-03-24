import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminLogin() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAdminAuth();

  const st = location.state as { from?: string } | null;
  const rawFrom = st?.from;
  const from =
    typeof rawFrom === "string" &&
    rawFrom.startsWith("/admin") &&
    rawFrom !== "/admin/login"
      ? rawFrom
      : "/admin";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    const result = await login(usuario, senha);
    setEnviando(false);
    if (result.ok) {
      navigate(from, { replace: true });
      return;
    }
    toast.error(result.error);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 md:left-8 md:top-8"
        onClick={() => navigate("/")}
        aria-label="Voltar para a landing page"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8" />
        <div className="bg-card rounded-lg shadow-sm border p-8 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-primary text-center">
              Acesso administrativo
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Área restrita. Informe suas credenciais.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-usuario">Usuário</Label>
                <Input
                  id="admin-usuario"
                  name="username"
                  autoComplete="username"
                  placeholder="Usuário"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  disabled={enviando}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-senha">Senha</Label>
                <Input
                  id="admin-senha"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={enviando}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
