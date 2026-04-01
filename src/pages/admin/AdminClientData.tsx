import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, MapPin, DollarSign, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContractsData } from "@/contexts/ContractsDataContext";
import type { Cliente } from "@/data/mockData";
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function emptyFormState() {
  return {
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    estadoCivil: "",
    instagram: "",
    contato1: "",
    contato2: "",
    enderecoResidencial: "",
    enderecoTrabalho: "",
    salario: "",
    dependentes: "",
    tipoMoradia: "",
    outrasRendas: "",
  };
}

function formStateFromCliente(c: Cliente) {
  return {
    nome: c.nome,
    cpf: c.cpf,
    email: c.email,
    telefone: c.telefone,
    estadoCivil: c.estadoCivil,
    instagram: c.instagram,
    contato1: c.contato1,
    contato2: c.contato2,
    enderecoResidencial: c.enderecoResidencial,
    enderecoTrabalho: c.enderecoTrabalho,
    salario: c.salario,
    dependentes: c.dependentes,
    tipoMoradia: c.tipoMoradia,
    outrasRendas: c.outrasRendas,
  };
}

export default function AdminClientData() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getClienteById,
    deleteCliente,
    sendClientePasswordReset,
    updateClienteManualFields,
    ready,
    loading,
  } = useContractsData();
  const cliente = id ? getClienteById(id) : undefined;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyFormState);

  useEffect(() => {
    if (!cliente || editing) return;
    setForm(formStateFromCliente(cliente));
  }, [cliente, editing]);

  const handleDeleteClient = async () => {
    if (!id) return;
    const ok = await deleteCliente(id);
    if (ok) navigate("/admin");
  };

  const handleResetPassword = async () => {
    if (!id) return;
    await sendClientePasswordReset(id);
  };

  const handleSave = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const ok = await updateClienteManualFields(id, {
        nome: form.nome,
        cpf: form.cpf,
        email: form.email,
        telefone: form.telefone,
        estadoCivil: form.estadoCivil || undefined,
        instagram: form.instagram,
        contato1: form.contato1,
        contato2: form.contato2,
        enderecoResidencial: form.enderecoResidencial,
        enderecoTrabalho: form.enderecoTrabalho,
        salario: form.salario,
        dependentes: form.dependentes,
        tipoMoradia: form.tipoMoradia || undefined,
        outrasRendas: form.outrasRendas,
      });
      if (ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando…</div>;
  }

  if (!cliente) return <div className="text-center py-12 text-muted-foreground">Cliente não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/admin/cliente/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold text-primary truncate">
            Dados de {editing ? form.nome || cliente.nome : cliente.nome}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setForm(formStateFromCliente(cliente));
                }}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
                {saving ? "Salvando…" : "Salvar alterações"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-2">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir este cliente para sempre?</AlertDialogTitle>
                    <AlertDialogDescription className="text-left space-y-3">
                      <span className="block font-medium text-destructive">
                        Esta ação não pode ser desfeita pelo painel.
                      </span>
                      <span className="block text-foreground">
                        Serão removidos permanentemente os dados do cliente, contratos,
                        parcelas e arquivos de boletos associados.
                      </span>
                      <span className="block">
                        Use esta opção apenas quando tiver certeza de que o usuário deve
                        ser removido do sistema.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => void handleDeleteClient()}
                    >
                      Sim, excluir permanentemente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><User className="h-5 w-5" /> Informações Pessoais</h2>
        <div className="rounded-lg border bg-background p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Acesso à conta do cliente</p>
            <p className="text-xs text-muted-foreground">
              A senha é protegida (hash) e não pode ser visualizada. Envie uma redefinição segura por e-mail.
            </p>
            {editing && (
              <p className="text-xs text-muted-foreground mt-2">
                Alterar o e-mail aqui atualiza a ficha e o perfil vinculado; o login no Supabase Auth continua no e-mail original até ser alterado no painel do Supabase, se necessário.
              </p>
            )}
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void handleResetPassword()} disabled={editing}>
            Enviar redefinição de senha
          </Button>
        </div>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-2 md:col-span-3">
              <Label htmlFor="acd-nome">Nome completo *</Label>
              <Input
                id="acd-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-cpf">CPF</Label>
              <Input
                id="acd-cpf"
                value={form.cpf}
                onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-email">E-mail</Label>
              <Input
                id="acd-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-tel">Telefone</Label>
              <Input
                id="acd-tel"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-ec">Estado civil</Label>
              <Input
                id="acd-ec"
                value={form.estadoCivil}
                onChange={(e) => setForm((f) => ({ ...f, estadoCivil: e.target.value }))}
                placeholder="Ex.: Solteiro(a) ou solteiro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-insta">Instagram</Label>
              <Input
                id="acd-insta"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="acd-c1">Contato 1</Label>
              <Input
                id="acd-c1"
                value={form.contato1}
                onChange={(e) => setForm((f) => ({ ...f, contato1: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="acd-c2">Contato 2</Label>
              <Input
                id="acd-c2"
                value={form.contato2}
                onChange={(e) => setForm((f) => ({ ...f, contato2: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Nome" value={cliente.nome} />
            <Field label="CPF" value={cliente.cpf} />
            <Field label="Email" value={cliente.email} />
            <Field label="Telefone" value={cliente.telefone} />
            <Field label="Estado Civil" value={cliente.estadoCivil} />
            <Field label="Instagram" value={cliente.instagram} />
            <Field label="Contato 1" value={cliente.contato1} />
            <Field label="Contato 2" value={cliente.contato2} />
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereços</h2>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="acd-er">Residencial</Label>
              <Input
                id="acd-er"
                value={form.enderecoResidencial}
                onChange={(e) => setForm((f) => ({ ...f, enderecoResidencial: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="acd-et">Trabalho</Label>
              <Input
                id="acd-et"
                value={form.enderecoTrabalho}
                onChange={(e) => setForm((f) => ({ ...f, enderecoTrabalho: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Residencial" value={cliente.enderecoResidencial} />
            <Field label="Trabalho" value={cliente.enderecoTrabalho} />
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><DollarSign className="h-5 w-5" /> Financeiro</h2>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acd-sal">Salário</Label>
              <Input
                id="acd-sal"
                value={form.salario}
                onChange={(e) => setForm((f) => ({ ...f, salario: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-dep">Dependentes</Label>
              <Input
                id="acd-dep"
                value={form.dependentes}
                onChange={(e) => setForm((f) => ({ ...f, dependentes: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acd-tm">Tipo de moradia</Label>
              <Input
                id="acd-tm"
                value={form.tipoMoradia}
                onChange={(e) => setForm((f) => ({ ...f, tipoMoradia: e.target.value }))}
                placeholder="Ex.: Aluguel ou aluguel"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="acd-or">Outras rendas</Label>
              <Input
                id="acd-or"
                value={form.outrasRendas}
                onChange={(e) => setForm((f) => ({ ...f, outrasRendas: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Salário" value={cliente.salario} />
            <Field label="Dependentes" value={cliente.dependentes} />
            <Field label="Tipo de Moradia" value={cliente.tipoMoradia} />
            <Field label="Outras Rendas" value={cliente.outrasRendas} />
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><FileText className="h-5 w-5" /> Documentos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["RG/CNH", "Selfie com documento", "Comprovante de endereço", "Holerite"].map((doc) => (
            <a key={doc} href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank" rel="noreferrer" className="border rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
              <FileText className="h-8 w-8 mx-auto text-secondary mb-2" />
              <p className="text-xs text-muted-foreground">{doc}</p>
              <p className="text-xs text-secondary font-medium mt-1">Abrir ↗</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
