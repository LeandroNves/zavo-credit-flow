import { useEffect, useState } from "react";
import { landingProductSeed } from "@/data/landingProductSeed";
import {
  PRODUCTS_UPDATED_EVENT,
  loadLandingProducts,
  type LandingProduct,
} from "@/lib/productsStore";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { isCatalogSupabaseConfigured } from "@/lib/productsSupabase";
import {
  fetchLandingProductsFromSupabase,
  subscribeLandingProductsChanges,
} from "@/lib/productsSupabase";

/**
 * Catálogo da landing / loja: Supabase quando configurado (global + Realtime);
 * senão localStorage com seed padrão (comportamento anterior).
 */
export function useGlobalLandingProductsState(): {
  products: LandingProduct[];
  isLoading: boolean;
} {
  const [products, setProducts] = useState<LandingProduct[]>(() =>
    isSupabaseConfigured ? [] : loadLandingProducts(landingProductSeed),
  );
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    let cancelled = false;

    const reload = async () => {
      if (!isSupabaseConfigured || !isCatalogSupabaseConfigured) {
        if (!cancelled) {
          setProducts(loadLandingProducts(landingProductSeed));
          setIsLoading(false);
        }
        return;
      }
      try {
        if (!cancelled) setIsLoading(true);
        const list = await fetchLandingProductsFromSupabase();
        if (!cancelled) {
          setProducts(list);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("[landing products] falha ao carregar do Supabase:", e);
        if (!cancelled) {
          setProducts([]);
          setIsLoading(false);
        }
      }
    };

    void reload();

    const unsubRealtime = subscribeLandingProductsChanges(() => {
      void reload();
    });

    const onLocal = () => {
      void reload();
    };
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onLocal);

    return () => {
      cancelled = true;
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, onLocal);
      unsubRealtime();
    };
  }, []);

  return { products, isLoading };
}

export function useGlobalLandingProducts(): LandingProduct[] {
  return useGlobalLandingProductsState().products;
}
