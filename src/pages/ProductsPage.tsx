import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, ShoppingCart, Trash2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RotatingProductImage } from "@/components/product/RotatingProductImage";
import { useGlobalLandingProducts } from "@/hooks/useGlobalLandingProducts";
import { calculateInstallmentCents, formatBRLFromCents } from "@/lib/productsStore";
import { CART_UPDATED_EVENT, loadCart, saveCart } from "@/lib/cartStore";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function ProductsPage() {
  const products = useGlobalLandingProducts();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => loadCart());
  const [cartCount, setCartCount] = useState(() =>
    loadCart().reduce((sum, it) => sum + it.qty, 0),
  );
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const update = () => {
      const list = loadCart();
      setCartItems(list);
      setCartCount(list.reduce((sum, it) => sum + it.qty, 0));
    };
    window.addEventListener(CART_UPDATED_EVENT, update);
    return () => window.removeEventListener(CART_UPDATED_EVENT, update);
  }, []);

  const removeItem = (id: string) => {
    const next = cartItems.filter((it) => it.id !== id);
    setCartItems(next);
    saveCart(next);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCart([]);
  };

  return (
    <div className="min-h-screen bg-background/40">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Zavo" className="h-32" />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
            <Link to="/" className="hover:text-secondary transition-colors">Início</Link>
            <Link to="/produtos" className="hover:text-secondary transition-colors">Produtos</Link>
            <a href="/#servicos" className="hover:text-secondary transition-colors">Serviços</a>
            <a href="/#diferenciais" className="hover:text-secondary transition-colors">Diferenciais</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="p-2" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu">
              {mobileMenu ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t px-4 py-4 space-y-3 animate-fade-in">
            <Link to="/" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Início</Link>
            <Link to="/produtos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Produtos</Link>
            <a href="/#servicos" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Serviços</a>
            <a href="/#diferenciais" className="block text-sm font-medium text-foreground/70" onClick={() => setMobileMenu(false)}>Diferenciais</a>
          </div>
        )}
      </header>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Carrinho</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
            ) : (
              <>
                <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                  {cartItems.map((it) => {
                    const p = products.find((x) => x.id === it.productId);
                    if (!p) return null;
                    return (
                      <div key={it.id} className="rounded-xl border p-3 bg-white flex items-center gap-3">
                        <div className="w-14 h-14 rounded-md bg-background overflow-hidden flex items-center justify-center">
                          <img src={(p.imageSrcs?.[0] ?? p.imageSrc)} alt={p.name} className="h-12 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{it.months}x • qtd {it.qty}</p>
                        </div>
                        <button type="button" onClick={() => removeItem(it.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" className="w-full" onClick={clearCart}>
                  Limpar carrinho
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((p) => {
            const per6 = p.priceCents ? calculateInstallmentCents(p.priceCents, 6) : 0;
            const per12 = p.priceCents ? calculateInstallmentCents(p.priceCents, 12) : 0;
            const total12 = per12 * 12;
            return (
              <Link
                key={p.id}
                to={`/produtos/${p.id}`}
                className="group bg-white rounded-2xl p-6 border border-border/50 hover:shadow-xl hover:border-secondary/30 transition-all duration-300"
              >
                <div className="h-56 flex items-center justify-center mb-5">
                  <RotatingProductImage
                    images={p.imageSrcs?.length ? p.imageSrcs : [p.imageSrc]}
                    alt={p.name}
                    containerClassName="h-48 w-full"
                    intervalMs={3000}
                  />
                </div>
                <h2 className="text-lg font-bold text-primary">{p.name}</h2>

                {p.priceCents > 0 ? (
                  <div className="mt-4 space-y-1">
                    <p className="text-base text-muted-foreground">
                      <span className="font-bold text-primary">A partir de 6x de {formatBRLFromCents(per6)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      12x de <span className="font-semibold text-primary">{formatBRLFromCents(per12)}</span> pagando até vencimento
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total em 12x: {formatBRLFromCents(total12)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Consulte valores com nosso time.</p>
                )}

                <Button className="w-full mt-5 rounded-full gap-2">
                  Ver produto <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">
            Nenhum produto disponível no momento.
          </div>
        )}
      </main>
    </div>
  );
}
