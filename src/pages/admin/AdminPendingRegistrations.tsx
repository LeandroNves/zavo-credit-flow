import { useCallback, useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { ProfileRow } from "@/lib/profileTypes";
import { approveProfile, rejectProfile } from "@/lib/approveRegistration";
import { getRegistrationDocPublicUrl } from "@/lib/registrationDocs";
import { useContractsData } from "@/contexts/ContractsDataContext";

function formatDataCadastro(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

type DocKey =
  | "doc_rg_path"
  | "doc_selfie_path"
  | "doc_comprovante_path"
  | "doc_holerite_path"
  | "doc_ctps_path"
  | "doc_extrato_path";

const DOC_LABELS: { key: DocKey; label: string }[] = [
  { key: "doc_rg_path", label: "RG/CNH" },
  { key: "doc_selfie_path", label: "Selfie com documento" },
  { key: "doc_comprovante_path", label: "Comprovante de endereço" },
  { key: "doc_holerite_path", label: "Holerite" },
  { key: "doc_ctps_path", label: "Carteira de trabalho" },
  { key: "doc_extrato_path", label: "Extrato bancário" },
];

export default function AdminPendingRegistrations() {
  const { reload: reloadContracts } = useContractsData();
  const [pendentes, setPendentes] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setPendentes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("registration_status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Não foi possível carregar cadastros pendentes.");
      setPendentes([]);
    } else {
      setPendentes((data ?? []) as ProfileRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (p: ProfileRow) => {
    if (!supabase) return;
    setActionLoading(true);
    const { error: approveErr } = await approveProfile(supabase, p);
    setActionLoading(false);
    if (approveErr) {
      toast.error(approveErr.message);
      return;
    }
    toast.success("Cadastro aprovado. Cliente criado na base.");
    setSelected(null);
    await load();
    await reloadContracts();
  };

  const handleReject = async (id: string) => {
    if (!supabase) return;
    setActionLoading(true);
    const { error: rejectErr } = await rejectProfile(supabase, id);
    setActionLoading(false);
    if (rejectErr) {
      toast.error(rejectErr.message);
      return;
    }
    toast.error("Cadastro reprovado.");
    setSelected(null);
    await load();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-primary">Cadastros pendentes</h1>
        <div className="bg-card rounded-lg border p-8 text-muted-foreground text-center">
          Configure o Supabase no <code className="text-xs">.env.local</code> para
          listar cadastros reais.
        </div>
      </div>
    );
  }

  if (selected && supabase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Análise de cadastro</h1>
          <Button variant="outline" type="button" onClick={() => setSelected(null)}>
            Voltar à lista
          </Button>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Dados pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ["Nome", selected.nome_completo],
              ["CPF", selected.cpf],
              ["E-mail", selected.email],
              ["Telefone", selected.telefone],
              ["Estado civil", selected.estado_civil],
              ["Instagram", selected.instagram || "—"],
              ["Contato 1", selected.contato1],
              ["Contato 2", selected.contato2],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="text-sm font-medium">{v || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Residencial</p>
              <p className="text-sm font-medium">{selected.endereco_residencial}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trabalho</p>
              <p className="text-sm font-medium">{selected.endereco_trabalho}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Financeiro</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Salário</p>
              <p className="text-sm font-medium">{selected.salario}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dependentes</p>
              <p className="text-sm font-medium">{selected.dependentes}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Moradia</p>
              <p className="text-sm font-medium">{selected.tipo_moradia}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outras rendas</p>
              <p className="text-sm font-medium">{selected.outras_rendas || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Documentos enviados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DOC_LABELS.map(({ key, label }) => {
              const path = selected[key];
              const url = getRegistrationDocPublicUrl(supabase, path);
              return (
                <div key={key} className="border rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-secondary font-medium mt-2 inline-block hover:underline"
                    >
                      Abrir ↗
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">Não enviado</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 gap-2 bg-success hover:bg-success/90"
            type="button"
            disabled={actionLoading}
            onClick={() => void handleApprove(selected)}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Aprovar
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            type="button"
            disabled={actionLoading}
            onClick={() => void handleReject(selected.id)}
          >
            <XCircle className="h-4 w-4" /> Reprovar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Cadastros pendentes</h1>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : pendentes.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
          Nenhum cadastro pendente.
        </div>
      ) : (
        <div className="grid gap-4">
          {pendentes.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{p.nome_completo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {p.cpf} • Cadastrado em {formatDataCadastro(p.created_at)}
                    </p>
                  </div>
                </div>
                <Button size="sm" type="button" onClick={() => setSelected(p)}>
                  Analisar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
