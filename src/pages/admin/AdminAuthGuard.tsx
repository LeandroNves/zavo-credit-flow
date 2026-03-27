import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { isAdminSessionValid } from "@/lib/adminSessionApi";

type State = "loading" | "ok" | "no";

export default function AdminAuthGuard() {
  const [state, setState] = useState<State>("loading");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await isAdminSessionValid();
        if (cancelled) return;
        setState(ok ? "ok" : "no");
      } catch {
        if (!cancelled) setState("no");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <span className="text-sm">Verificando acesso…</span>
      </div>
    );
  }

  if (state === "no") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
