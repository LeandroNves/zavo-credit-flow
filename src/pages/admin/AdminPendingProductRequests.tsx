import { useCallback, useEffect, useState } from "react";
import { Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { deleteProductRequest, fetchProductRequests, type ProductRequestRow } from "@/lib/productRequestsSupabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type RequestWithClient = {
  request: ProductRequestRow;
  client: {
    id: string;
    nome: string | null;
    cpf: string | null;
    email: string | null;
    telefone: string | null;
  } | null;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function AdminPendingProductRequests() {
  const [rows, setRows] = useState<RequestWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<RequestWithClient | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchProductRequests(supabase));
    } catch {
      toast.error("Não foi possível carregar produtos pendentes.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeleteRequest = async (requestId: string) => {
    if (!supabase) return;
    setDeletingId(requestId);
    try {
      await deleteProductRequest(supabase, requestId);
      setRows((prev) => prev.filter((row) => row.request.id !== requestId));
      setSelected((prev) => (prev?.request.id === requestId ? null : prev));
      toast.success("Solicitação excluída com sucesso.");
    } catch {
      toast.error("Não foi possível excluir a solicitação.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-primary">Produtos pendentes</h1>
        <div className="bg-card rounded-lg border p-8 text-muted-foreground text-center">
          Configure o Supabase para listar solicitações reais.
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Solicitação de produtos</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Voltar à lista
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  disabled={deletingId === selected.request.id}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir solicitação
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta solicitação para sempre?</AlertDialogTitle>
                  <AlertDialogDescription className="text-left space-y-3">
                    <span className="block font-medium text-destructive">
                      Esta ação não pode ser desfeita pelo painel.
                    </span>
                    <span className="block text-foreground">
                      Serão removidos permanentemente os produtos selecionados,
                      data da solicitação e o vínculo desta solicitação com o cliente.
                    </span>
                    <span className="block">
                      Confirme apenas se tiver certeza de que este pedido já foi tratado
                      e deve sumir da lista de pendentes.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void handleDeleteRequest(selected.request.id)}
                  >
                    Sim, excluir permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-3">
          <h2 className="font-semibold text-primary">Dados do cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div><p className="text-xs text-muted-foreground">Nome</p><p className="text-sm font-medium">{selected.client?.nome || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">CPF</p><p className="text-sm font-medium">{selected.client?.cpf || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">E-mail</p><p className="text-sm font-medium">{selected.client?.email || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm font-medium">{selected.client?.telefone || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Data da solicitação</p><p className="text-sm font-medium">{formatDate(selected.request.created_at)}</p></div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-3">
          <h2 className="font-semibold text-primary">Produtos selecionados</h2>
          <div className="space-y-2">
            {selected.request.items.map((it, idx) => (
              <div key={`${it.productId}-${idx}`} className="text-sm text-muted-foreground rounded-lg border p-3">
                <span className="font-medium text-primary">{it.qty}x</span> {it.name}
                {it.color ? ` (${it.color})` : ""} —{" "}
                <span className="font-medium text-primary">{it.months}x</span> de{" "}
                <span className="font-medium text-primary">{it.perInstallmentBRL}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Pedidos pendentes</h1>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
          Nenhuma solicitação de produto no momento.
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <div key={row.request.id} className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{row.client?.nome || "Cliente"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {row.request.items.length} item(ns) • {formatDate(row.request.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setSelected(row)}>
                    Ver solicitação
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        disabled={deletingId === row.request.id}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir esta solicitação para sempre?</AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-3">
                          <span className="block font-medium text-destructive">
                            Esta ação não pode ser desfeita pelo painel.
                          </span>
                          <span className="block text-foreground">
                            Serão removidos permanentemente os produtos selecionados,
                            data da solicitação e o vínculo desta solicitação com o cliente.
                          </span>
                          <span className="block">
                            Confirme apenas se tiver certeza de que este pedido já foi tratado
                            e deve sumir da lista de pendentes.
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          type="button"
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => void handleDeleteRequest(row.request.id)}
                        >
                          Sim, excluir permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

