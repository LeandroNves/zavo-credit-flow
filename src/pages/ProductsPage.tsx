import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter, Loader2, Menu, Search, ShoppingCart, Trash2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotatingProductImage } from "@/components/product/RotatingProductImage";
import { useGlobalLandingProductsState } from "@/hooks/useGlobalLandingProducts";
import {
  calculateInstallmentCents,
  formatBRLFromCents,
  PRODUCT_BRANDS,
  PRODUCT_CATEGORIES,
  type LandingProduct,
} from "@/lib/productsStore";
import { CART_UPDATED_EVENT, loadCart, saveCart } from "@/lib/cartStore";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortMode = "mais-vendidos" | "menor-preco" | "maior-preco" | "promocoes";

export default function ProductsPage() {
  const { products, isLoading } = useGlobalLandingProductsState();
  const [searchParams] = useSearchParams();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => loadCart());
  const [cartCount, setCartCount] = useState(() =>
    loadCart().reduce((sum, it) => sum + it.qty, 0),
  );
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Todos" | (typeof PRODUCT_CATEGORIES)[number]>("Todos");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onlyOnSale, setOnlyOnSale] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("mais-vendidos");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const [priceInput, setPriceInput] = useState<{ min: string; max: string }>({ min: "", max: "" });

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

  useEffect(() => {
    const prices = products
      .map((p) => p.priceCents)
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    if (!prices.length) {
      setPriceRange({ min: 0, max: 0 });
      setPriceInput({ min: "", max: "" });
      return;
    }
    const next = { min: prices[0], max: prices[prices.length - 1] };
    setPriceRange(next);
    setPriceInput({ min: String(Math.floor(next.min / 100)), max: String(Math.floor(next.max / 100)) });
  }, [products]);

  useEffect(() => {
    const searchValue = searchParams.get("search") ?? "";
    const categoryValue = searchParams.get("category");
    const sortValue = searchParams.get("sort");
    const saleOnlyValue = searchParams.get("saleOnly");
    const brandsValue = searchParams.get("brands");
    const minPriceValue = searchParams.get("minPrice");
    const maxPriceValue = searchParams.get("maxPrice");

    setSearch(searchValue);
    if (categoryValue && (PRODUCT_CATEGORIES as readonly string[]).includes(categoryValue)) {
      setSelectedCategory(categoryValue as "Todos" | (typeof PRODUCT_CATEGORIES)[number]);
    } else {
      setSelectedCategory("Todos");
    }
    if (sortValue && ["mais-vendidos", "menor-preco", "maior-preco", "promocoes"].includes(sortValue)) {
      setSortMode(sortValue as SortMode);
    }
    setOnlyOnSale(saleOnlyValue === "1");
    if (brandsValue) {
      const parsed = brandsValue
        .split(",")
        .map((x) => x.trim())
        .filter((x) => (PRODUCT_BRANDS as readonly string[]).includes(x));
      setSelectedBrands(parsed);
    } else {
      setSelectedBrands([]);
    }
    if (minPriceValue || maxPriceValue) {
      setPriceInput({
        min: (minPriceValue ?? "").replace(/[^\d]/g, ""),
        max: (maxPriceValue ?? "").replace(/[^\d]/g, ""),
      });
    }
  }, [searchParams]);

  function toggleBrand(brand: string, checked: boolean) {
    setSelectedBrands((prev) => {
      if (checked) return prev.includes(brand) ? prev : [...prev, brand];
      return prev.filter((value) => value !== brand);
    });
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = Number(priceInput.min || "0");
    const max = Number(priceInput.max || "0");
    const minCents = Number.isFinite(min) ? Math.max(0, Math.round(min * 100)) : 0;
    const maxCents = Number.isFinite(max) ? Math.max(0, Math.round(max * 100)) : 0;

    let list = products.filter((p) => {
      if (selectedCategory !== "Todos" && p.category !== selectedCategory) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (onlyOnSale && !p.isOnSale) return false;
      if (p.priceCents > 0 && minCents > 0 && p.priceCents < minCents) return false;
      if (p.priceCents > 0 && maxCents > 0 && p.priceCents > maxCents) return false;
      if (!term) return true;
      const fields = [p.name, p.brand, p.category, p.color].join(" ").toLowerCase();
      return fields.includes(term);
    });

    list = [...list].sort((a, b) => {
      if (sortMode === "menor-preco") return a.priceCents - b.priceCents;
      if (sortMode === "maior-preco") return b.priceCents - a.priceCents;
      if (sortMode === "promocoes") {
        if (a.isOnSale === b.isOnSale) return b.updatedAt.localeCompare(a.updatedAt);
        return a.isOnSale ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [onlyOnSale, priceInput.max, priceInput.min, products, search, selectedBrands, selectedCategory, sortMode]);

  function renderFilterPanel() {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-base font-semibold text-primary">Categorias</p>
          <div className="mt-3 space-y-2">
            {["Todos", ...PRODUCT_CATEGORIES].map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category as "Todos" | (typeof PRODUCT_CATEGORIES)[number])}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-muted border-border"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-primary">Marcas</p>
          <div className="mt-3 space-y-2 max-h-56 overflow-auto pr-1">
            {PRODUCT_BRANDS.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={(event) => toggleBrand(brand, event.target.checked)}
                />
                {brand}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-primary">Preço</p>
          <p className="text-sm text-muted-foreground mt-1">
            Faixa atual: {formatBRLFromCents(priceRange.min)} - {formatBRLFromCents(priceRange.max)}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Input
              value={priceInput.min}
              onChange={(event) => setPriceInput((prev) => ({ ...prev, min: event.target.value.replace(/[^\d]/g, "") }))}
              placeholder="Mín"
            />
            <Input
              value={priceInput.max}
              onChange={(event) => setPriceInput((prev) => ({ ...prev, max: event.target.value.replace(/[^\d]/g, "") }))}
              placeholder="Máx"
            />
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-primary">Ofertas</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyOnSale}
              onChange={(event) => setOnlyOnSale(event.target.checked)}
            />
            Somente produtos em promoção
          </label>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setSearch("");
            setSelectedCategory("Todos");
            setSelectedBrands([]);
            setOnlyOnSale(false);
            setSortMode("mais-vendidos");
            setPriceInput({
              min: String(Math.floor(priceRange.min / 100)),
              max: String(Math.floor(priceRange.max / 100)),
            });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    );
  }

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

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{renderFilterPanel()}</div>
        </SheetContent>
      </Sheet>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <section className="bg-white border rounded-2xl p-4 md:p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">Nossos produtos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Encontre o produto ideal e filtre por categoria, marca, preço e promoção.
              </p>
            </div>
            <Button type="button" variant="outline" className="md:hidden gap-2" onClick={() => setMobileFiltersOpen(true)}>
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_200px] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar produtos, marcas ou modelos..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as "Todos" | (typeof PRODUCT_CATEGORIES)[number])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas as categorias</SelectItem>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mais-vendidos">Mais vendidos</SelectItem>
                <SelectItem value="menor-preco">Menor preço</SelectItem>
                <SelectItem value="maior-preco">Maior preço</SelectItem>
                <SelectItem value="promocoes">Promoções</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 overflow-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("Todos")}
              className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap ${
                selectedCategory === "Todos" ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border"
              }`}
            >
              Todos
            </button>
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap ${
                  selectedCategory === category ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="hidden lg:block bg-white border rounded-2xl p-4 h-fit sticky top-24">
            {renderFilterPanel()}
          </aside>

          <div>
            <div className="text-sm text-muted-foreground mb-3">
              {filteredProducts.length} produto(s) encontrado(s)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((p: LandingProduct) => {
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
                <p className="text-sm text-muted-foreground mt-1">{p.brand} • {p.category}</p>
                {p.isOnSale && (
                  <span className="inline-flex mt-2 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Em promoção
                  </span>
                )}

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

            {isLoading && (
              <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground mt-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando produtos...
                </div>
              </div>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground mt-6">
                Nenhum produto encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
