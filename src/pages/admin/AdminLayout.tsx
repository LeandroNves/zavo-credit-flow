import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Clock, BarChart3, LogOut, Menu, X, Shield, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import mascote from "@/assets/mascote.png";

const menuItems = [
  { icon: Users, label: "Gestão de Clientes", path: "/admin" },
  { icon: ShoppingBag, label: "Produtos (Landing)", path: "/admin/produtos" },
  { icon: Clock, label: "Cadastros Pendentes", path: "/admin/pendentes" },
  { icon: BarChart3, label: "Relatórios", path: "/admin/relatorios" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname.startsWith("/admin/cliente");
    }
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 flex items-center gap-2 border-b border-sidebar-border">
        <img src={mascote} alt="" className="w-10" />
        <Shield className="h-4 w-4 ml-auto text-sidebar-primary" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-sidebar-accent/50 w-full text-sidebar-foreground"
        >
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform md:hidden flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-sidebar-foreground" /></button>
        </div>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-4 border-b bg-card md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-semibold text-primary">Zavo Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
