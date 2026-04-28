import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RotatingProductImage } from "@/components/product/RotatingProductImage";
import { useGlobalLandingProducts } from "@/hooks/useGlobalLandingProducts";
import { calculateInstallmentCents, formatBRLFromCents } from "@/lib/productsStore";

export default function ProductsPage() {
  const products = useGlobalLandingProducts();

  return (
    <div className="min-h-screen bg-background/40">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Voltar para landing
          </Link>
          <h1 className="text-lg font-semibold text-primary">Produtos</h1>
        </div>
      </header>

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
