import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Upload, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { landingProductSeed } from "@/data/landingProductSeed";
import {
  ALL_INSTALLMENTS,
  type InstallmentMonths,
  type LandingProduct,
  PRODUCTS_UPDATED_EVENT,
  calculateInstallmentCents,
  formatBRLFromCents,
  loadLandingProducts,
  makeProductId,
  saveLandingProducts,
} from "@/lib/productsStore";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { isCatalogSupabaseConfigured } from "@/lib/supabaseCatalogClient";
import {
  fetchLandingProductsFromSupabase,
  subscribeLandingProductsChanges,
} from "@/lib/productsSupabase";

function toCentsFromBRL(input: string): number {
  const normalized = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num * 100));
}

function fromCentsToBRLInput(cents: number): string {
  const v = (cents || 0) / 100;
  return v.toFixed(2).replace(".", ",");
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

const MONTH_LABEL: Record<InstallmentMonths, string> = {
  6: "6 meses",
  12: "12 meses",
  18: "18 meses",
  24: "24 meses",
};

type Draft = {
  id?: string;
  name: string;
  color: string;
  price: string;
  imageSrcs: string[];
  enabledMonths: InstallmentMonths[];
};

function makeEmptyDraft(): Draft {
  return {
    name: "",
    color: "",
    price: "",
    imageSrcs: [],
    enabledMonths: [...ALL_INSTALLMENTS],
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState<LandingProduct[]>(() =>
    isSupabaseConfigured ? [] : loadLandingProducts(),
  );
  const [draft, setDraft] = useState<Draft>(() => makeEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isSupabaseConfigured && isCatalogSupabaseConfigured) {
        try {
          const list = await fetchLandingProductsFromSupabase();
          if (!cancelled) setProducts(list);
        } catch (e) {
          console.warn("[admin produtos] falha ao carregar:", e);
          if (!cancelled) setProducts([]);
        }
      } else if (!cancelled) {
        setProducts(loadLandingProducts());
      }
    }

    void load();

    const unsubRealtime = subscribeLandingProductsChanges(() => {
      void load();
    });

    const onUpdate = () => {
      void load();
    };
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onUpdate);
    return () => {
      cancelled = true;
      unsubRealtime();
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, onUpdate);
    };
  }, []);

  const sorted = useMemo(
    () => [...products].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [products],
  );

  const previewInstallments = useMemo(() => {
    const priceCents = toCentsFromBRL(draft.price);
    return draft.enabledMonths
      .slice()
      .sort((a, b) => a - b)
      .map((m) => ({
        months: m,
        perInstallment: calculateInstallmentCents(priceCents, m),
      }));
  }, [draft.price, draft.enabledMonths]);

  function resetDraft() {
    setDraft(makeEmptyDraft());
    setEditingId(null);
  }

  async function persist(next: LandingProduct[]) {
    const prev = products;
    setProducts(next);
    if (isSupabaseConfigured) {
      try {
        const r = await fetch("/api/admin/products", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: next }),
        });
        const data = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          message?: string;
        };
        if (!r.ok || !data.ok) {
          setProducts(prev);
          toast.error(
            data.error === "supabase_not_configured"
              ? "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor (ex.: Vercel)."
              : data.error === "unauthorized"
                ? "Sessão admin expirada. Faça login novamente."
                : data.message || data.error || "Não foi possível salvar o catálogo.",
          );
          return;
        }
        try {
          window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
        } catch {
          /* ignore */
        }
        toast.success("Catálogo publicado para todos os visitantes.");
      } catch {
        setProducts(prev);
        toast.error("Erro de rede ao salvar o catálogo.");
      }
    } else {
      saveLandingProducts(next);
    }
  }

  function startEdit(p: LandingProduct) {
    setEditingId(p.id);
    setDraft({
      id: p.id,
      name: p.name,
      color: p.color,
      price: fromCentsToBRLInput(p.priceCents),
      imageSrcs: [...(p.imageSrcs?.length ? p.imageSrcs : [p.imageSrc])],
      enabledMonths: [...p.enabledMonths],
    });
  }

  function remove(id: string) {
    void persist(products.filter((p) => p.id !== id));
    if (editingId === id) resetDraft();
  }

  function toggleMonth(m: InstallmentMonths, checked: boolean) {
    setDraft((d) => {
      const next = new Set(d.enabledMonths);
      if (checked) next.add(m);
      else next.delete(m);
      const list = Array.from(next).sort((a, b) => a - b) as InstallmentMonths[];
      return { ...d, enabledMonths: list.length ? list : d.enabledMonths };
    });
  }

  async function onPickImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const picked = await Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
    setDraft((d) => {
      const merged = [...d.imageSrcs, ...picked].filter(Boolean);
      const unique = merged.filter((v, i, a) => a.indexOf(v) === i);
      return { ...d, imageSrcs: unique };
    });
  }

  function removeDraftImage(idx: number) {
    setDraft((d) => ({ ...d, imageSrcs: d.imageSrcs.filter((_, i) => i !== idx) }));
  }

  async function save() {
    const name = draft.name.trim();
    const color = draft.color.trim();
    const imageSrcs = draft.imageSrcs
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((x, i, a) => a.indexOf(x) === i);
    const imageSrc = imageSrcs[0] ?? "";
    const priceCents = toCentsFromBRL(draft.price);
    const enabledMonths = draft.enabledMonths.length ? draft.enabledMonths : [...ALL_INSTALLMENTS];

    if (!name) return;
    if (!imageSrc) return;
    if (priceCents <= 0) return;

    const nowIso = new Date().toISOString();

    if (editingId) {
      const next = products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name,
              color,
              imageSrc,
              imageSrcs,
              priceCents,
              enabledMonths,
              updatedAt: nowIso,
            }
          : p,
      );
      await persist(next);
      resetDraft();
      return;
    }

    const newProduct: LandingProduct = {
      id: makeProductId(),
      name,
      color,
      imageSrc,
      imageSrcs,
      priceCents,
      enabledMonths,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await persist([newProduct, ...products]);
    resetDraft();
  }

  function seedIfEmpty() {
    if (isSupabaseConfigured && isCatalogSupabaseConfigured) {
      void fetchLandingProductsFromSupabase()
        .then(setProducts)
        .catch(() => setProducts([]));
      return;
    }
    setProducts(loadLandingProducts(landingProductSeed));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Produtos da Landing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os itens de “Produtos mais procurados” (imagem, nome, cor, preço e parcelas).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={seedIfEmpty}>
            <RefreshCcw className="h-4 w-4" /> Recarregar
          </Button>
          <Button className="gap-2" onClick={() => resetDraft()}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-primary">
              {editingId ? "Editar produto" : "Adicionar produto"}
            </h2>
            {(editingId || draft.name || draft.imageSrcs.length > 0 || draft.price || draft.color) && (
              <Button variant="ghost" size="sm" onClick={resetDraft}>
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder='Ex.: iPhone 17 Pro Max'
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <Input
              value={draft.color}
              onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
              placeholder='Ex.: Titânio Azul'
            />
          </div>

          <div className="space-y-2">
            <Label>Preço do produto (R$)</Label>
            <Input
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              placeholder="7000,00"
              inputMode="decimal"
            />
            <p className="text-xs text-muted-foreground">
              O usuário final verá apenas as parcelas (com taxas e arredondamento para “.99”).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Imagens do produto</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void onPickImages(e.target.files)}
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {draft.imageSrcs.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {draft.imageSrcs.map((src, idx) => (
                  <div key={`${src}-${idx}`} className="rounded-xl border bg-background p-2">
                    <div className="h-28 rounded-lg border bg-card flex items-center justify-center overflow-hidden">
                      <img src={src} alt="" className="h-24 object-contain" />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full mt-1 text-destructive hover:text-destructive"
                      onClick={() => removeDraftImage(idx)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Parcelas visíveis</Label>
            <div className="grid grid-cols-2 gap-3">
              {ALL_INSTALLMENTS.map((m) => {
                const checked = draft.enabledMonths.includes(m);
                return (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={checked} onCheckedChange={(v) => toggleMonth(m, Boolean(v))} />
                    {MONTH_LABEL[m]}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <p className="text-sm font-medium text-primary mb-2">Prévia de parcelas</p>
            <div className="space-y-1">
              {previewInstallments.map((x) => (
                <div key={x.months} className="text-sm text-muted-foreground">
                  {x.months}x de <span className="font-semibold text-primary">{formatBRLFromCents(x.perInstallment)}</span>
                </div>
              ))}
              {previewInstallments.length === 0 && (
                <div className="text-sm text-muted-foreground">Selecione ao menos uma opção.</div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => void save()}>
              {editingId ? "Salvar alterações" : "Adicionar produto"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetDraft}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-3 bg-card border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-primary">Lista</h2>
            <span className="text-xs text-muted-foreground">{sorted.length} item(ns)</span>
          </div>
          <div className="divide-y">
            {sorted.map((p) => (
              <div key={p.id} className="p-5 flex gap-4 items-start">
                <div className="w-20 h-20 rounded-xl border bg-background flex items-center justify-center overflow-hidden">
                  <img src={(p.imageSrcs?.[0] ?? p.imageSrc)} alt={p.name} className="h-16 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-primary truncate">{p.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{p.color}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => startEdit(p)}>
                        <Pencil className="h-4 w-4" /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" className="gap-2" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4" /> Remover
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    Preço base: <span className="font-medium text-primary">{formatBRLFromCents(p.priceCents)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.enabledMonths
                      .slice()
                      .sort((a, b) => a - b)
                      .map((m) => (
                        <span
                          key={m}
                          className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          {m}x de {formatBRLFromCents(calculateInstallmentCents(p.priceCents, m))}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}

            {sorted.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                Nenhum produto cadastrado ainda. Use o formulário ao lado para adicionar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

