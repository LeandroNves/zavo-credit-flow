import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isAdminSessionValid } from "@/lib/adminSessionApi";

const CLIENT_LOCK_KEY = "zavo_admin_login_lock_until";
const CLIENT_FAIL_KEY = "zavo_admin_login_fails";

function getClientLock(): { lockedUntil: number; fails: number } {
  try {
    const raw = sessionStorage.getItem(CLIENT_LOCK_KEY);
    const failsRaw = sessionStorage.getItem(CLIENT_FAIL_KEY);
    return {
      lockedUntil: raw ? parseInt(raw, 10) : 0,
      fails: failsRaw ? parseInt(failsRaw, 10) : 0,
    };
  } catch {
    return { lockedUntil: 0, fails: 0 };
  }
}

function setClientFail(fails: number): void {
  sessionStorage.setItem(CLIENT_FAIL_KEY, String(fails));
  if (fails >= 6) {
    const until = Date.now() + 5 * 60 * 1000;
    sessionStorage.setItem(CLIENT_LOCK_KEY, String(until));
    sessionStorage.setItem(CLIENT_FAIL_KEY, "0");
  }
}

function clearClientLock(): void {
  sessionStorage.removeItem(CLIENT_LOCK_KEY);
  sessionStorage.removeItem(CLIENT_FAIL_KEY);
}

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [clientLockUntil, setClientLockUntil] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from && (location.state as { from: string }).from !== "/admin/login"
      ? (location.state as { from: string }).from
      : "/admin";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await isAdminSessionValid()) {
          if (cancelled) return;
          navigate(from, { replace: true });
          return;
        }
      } catch {
        /* offline / api down */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, navigate]);

  useEffect(() => {
    const t = setInterval(() => {
      const { lockedUntil } = getClientLock();
      setClientLockUntil(lockedUntil);
    }, 500);
    const { lockedUntil } = getClientLock();
    setClientLockUntil(lockedUntil);
    return () => clearInterval(t);
  }, []);

  const locked = clientLockUntil > Date.now();
  const lockSec = locked ? Math.ceil((clientLockUntil - Date.now()) / 1000) : 0;

  async function handleSubmit() {
    if (locked) {
      toast.error(`Aguarde ${lockSec}s antes de tentar novamente.`);
      return;
    }
    const u = username.trim();
    if (!u || !password) {
      toast.error("Preencha usuário e senha.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password }),
      });

      const data = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        retryAfterSec?: number;
      };

      if (r.status === 429) {
        const sec = data.retryAfterSec ?? 60;
        toast.error(`Muitas tentativas. Tente novamente em ~${sec}s.`);
        return;
      }

      if (r.status === 503) {
        toast.error(
          "Servidor sem configuração de admin (ADMIN_* / ADMIN_SESSION_SECRET). Veja o terminal do npm run dev.",
        );
        return;
      }

      if (!r.ok || !data.ok) {
        const { fails } = getClientLock();
        setClientFail(fails + 1);
        if (r.status === 401) {
          toast.error("Usuário ou senha incorretos.");
        } else {
          toast.error(
            `Resposta inesperada (${r.status}). Se a API não existir, confira o terminal ao subir o dev server.`,
          );
        }
        return;
      }

      clearClientLock();
      toast.success("Acesso autorizado.");
      navigate(from, { replace: true });
    } catch {
      toast.error("Não foi possível conectar. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 md:left-8 md:top-8"
        type="button"
        onClick={() => navigate("/")}
        aria-label="Voltar para a página inicial"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-sm border p-8 space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" aria-hidden />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary text-center">
            Painel administrativo
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Acesso restrito. As credenciais são verificadas no servidor; a sessão usa
            cookie seguro (HttpOnly).
          </p>
          {locked && (
            <p className="text-sm text-destructive text-center">
              Muitas tentativas neste navegador. Aguarde {lockSec}s.
            </p>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-user">Usuário</Label>
              <Input
                id="admin-user"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuário administrativo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Senha</Label>
              <Input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
              />
            </div>
          </div>
          <Button
            className="w-full"
            type="button"
            disabled={loading || locked}
            onClick={() => void handleSubmit()}
          >
            {loading ? "Entrando…" : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Área do cliente?{" "}
            <Link to="/login" className="text-secondary font-medium hover:underline">
              Login do portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
