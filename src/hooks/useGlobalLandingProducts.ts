import { useEffect, useState } from "react";
import { landingProductSeed } from "@/data/landingProductSeed";
import {
  PRODUCTS_UPDATED_EVENT,
  loadLandingProducts,
  type LandingProduct,
} from "@/lib/productsStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  fetchLandingProductsFromSupabase,
  subscribeLandingProductsChanges,
} from "@/lib/productsSupabase";

/**
 * Catálogo da landing / loja: Supabase quando configurado (global + Realtime);
 * senão localStorage com seed padrão (comportamento anterior).
 */
export function useGlobalLandingProducts(): LandingProduct[] {
  const [products, setProducts] = useState<LandingProduct[]>(() =>
    isSupabaseConfigured ? [] : loadLandingProducts(landingProductSeed),
  );

  useEffect(() => {
    let cancelled = false;

    const reload = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) {
          setProducts(loadLandingProducts(landingProductSeed));
        }
        return;
      }
      try {
        const list = await fetchLandingProductsFromSupabase();
        if (!cancelled) setProducts(list);
      } catch {
        if (!cancelled) setProducts([]);
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

  return products;
}
