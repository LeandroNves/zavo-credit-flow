import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { User, FileText, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import mascote from "@/assets/mascote.png";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { clearClienteAtualId, setClienteAtualId } from "@/lib/clienteSession";

const menuItems = [
  { icon: FileText, label: "Contratos", path: "/cliente" },
  { icon: User, label: "Dados Pessoais", path: "/cliente/dados" },
];

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(() => !isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        clearClienteAtualId();
        navigate("/login", { replace: true });
        setLayoutReady(true);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("registration_status, linked_client_id")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!prof) {
        navigate("/login", { replace: true });
        setLayoutReady(true);
        return;
      }
      if (prof.registration_status === "pending") {
        navigate("/cadastro/aguardando", { replace: true });
        setLayoutReady(true);
        return;
      }
      if (prof.registration_status === "rejected") {
        await supabase.auth.signOut();
        clearClienteAtualId();
        navigate("/login", { replace: true });
        setLayoutReady(true);
        return;
      }
      if (prof.linked_client_id) {
        setClienteAtualId(prof.linked_client_id);
      }
      setLayoutReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogout() {
    clearClienteAtualId();
    if (supabase) await supabase.auth.signOut();
    navigate("/login");
  }

  if (!layoutReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Verificando sessão…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground">
        <div className="p-5 flex items-center gap-2 border-b border-sidebar-border">
          <img src={mascote} alt="Mascote" className="w-10" />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const active =
              item.path === "/cliente"
                ? location.pathname === "/cliente" ||
                  location.pathname.startsWith("/cliente/contrato")
                : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 w-full"
          >
            <LogOut className="h-5 w-5" /> Sair
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform md:hidden flex flex-col ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img src={mascote} alt="" className="w-10" />
            <img src={logo} alt="Zavo" className="h-6 brightness-0 invert" />
          </div>
          <button type="button" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {menuItems.map((item) => {
            const active =
              item.path === "/cliente"
                ? location.pathname === "/cliente" ||
                  location.pathname.startsWith("/cliente/contrato")
                : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 w-full"
          >
            <LogOut className="h-5 w-5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-4 border-b bg-card md:hidden">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold text-primary">Zavo</span>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
