import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Upload, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { landingProductSeed } from "@/data/landingProductSeed";
import {
  ALL_INSTALLMENTS,
  type InstallmentMonths,
  type LandingProduct,
  PRODUCT_BRANDS,
  PRODUCT_CATEGORIES,
  type ProductBrand,
  type ProductCategory,
  PRODUCTS_UPDATED_EVENT,
  calculateInstallmentCents,
  formatBRLFromCents,
  loadLandingProducts,
  makeProductId,
  saveLandingProducts,
} from "@/lib/productsStore";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { isCatalogSupabaseConfigured } from "@/lib/productsSupabase";
import {
  fetchLandingProductsFromSupabase,
  subscribeLandingProductsChanges,
} from "@/lib/productsSupabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  1: "À vista (1x)",
  6: "6 meses",
  12: "12 meses",
  18: "18 meses",
  24: "24 meses",
};

type Draft = {
  id?: string;
  name: string;
  category: ProductCategory;
  brand: ProductBrand;
  isOnSale: boolean;
  color: string;
  description: string;
  deliveryTime: string;
  specificationsInput: string;
  price: string;
  imageSrcs: string[];
  enabledMonths: InstallmentMonths[];
};

function makeEmptyDraft(): Draft {
  return {
    name: "",
    category: "Celular",
    brand: "Apple",
    isOnSale: false,
    color: "",
    description: "",
    deliveryTime: "",
    specificationsInput: "",
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
                : data.error === "invalid_service_role_key"
                  ? data.message ||
                    "Use a chave service_role (secreta) em SUPABASE_SERVICE_ROLE_KEY, não a chave anon."
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
      category: p.category,
      brand: p.brand,
      isOnSale: p.isOnSale,
      color: p.color,
      description: p.description ?? "",
      deliveryTime: p.deliveryTime ?? "",
      specificationsInput: (p.specifications ?? []).join(", "),
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
    const category = draft.category;
    const brand = draft.brand;
    const isOnSale = draft.isOnSale;
    const description = draft.description.trim();
    const deliveryTime = draft.deliveryTime.trim();
    const specifications = draft.specificationsInput
      .split(/[,\n]/g)
      .map((x) => x.trim())
      .filter(Boolean)
      .filter((x, i, arr) => arr.indexOf(x) === i);
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
              category,
              brand,
              isOnSale,
              color,
              description,
              deliveryTime,
              specifications,
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
      category,
      brand,
      isOnSale,
      color,
      description,
      deliveryTime,
      specifications,
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
            Gerencie os itens da loja com categoria, marca, promoção, imagens, preço e parcelas.
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
            {(editingId || draft.name || draft.imageSrcs.length > 0 || draft.price || draft.color || draft.description || draft.deliveryTime || draft.specificationsInput) && (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft((d) => ({ ...d, category: value as ProductCategory }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                value={draft.brand}
                onValueChange={(value) => setDraft((d) => ({ ...d, brand: value as ProductBrand }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_BRANDS.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={draft.isOnSale}
              onCheckedChange={(value) => setDraft((d) => ({ ...d, isOnSale: Boolean(value) }))}
            />
            Produto em promoção
          </label>

          <div className="space-y-2">
            <Label>Cor</Label>
            <Input
              value={draft.color}
              onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
              placeholder='Ex.: Preto, Branco, Laranja'
            />
            <p className="text-xs text-muted-foreground">
              A ordem das cores deve seguir a ordem das imagens para seleção na página do produto.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Especificações (opções)</Label>
            <Input
              value={draft.specificationsInput}
              onChange={(e) => setDraft((d) => ({ ...d, specificationsInput: e.target.value }))}
              placeholder="Ex.: 256GB, 512GB"
            />
            <p className="text-xs text-muted-foreground">
              Separe por vírgula. O cliente escolherá uma opção no detalhe do produto.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Detalhes do produto para exibir na página de produto."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Prazo de entrega</Label>
            <Textarea
              value={draft.deliveryTime}
              onChange={(e) => setDraft((d) => ({ ...d, deliveryTime: e.target.value }))}
              placeholder="Ex.: Envio em até 2 dias úteis e entrega entre 5 e 10 dias úteis."
              rows={3}
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
                      <p className="text-sm text-muted-foreground truncate">{p.brand} • {p.category}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.color}</p>
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
                  {p.isOnSale && (
                    <div className="mt-1 text-xs font-medium text-emerald-700">Em promoção</div>
                  )}

                  {!!p.specifications?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.specifications.map((spec) => (
                        <span key={`${p.id}-${spec}`} className="text-xs px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {!!p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                  {!!p.deliveryTime && <p className="mt-1 text-xs text-muted-foreground">Prazo: {p.deliveryTime}</p>}

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

