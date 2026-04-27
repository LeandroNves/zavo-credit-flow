import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContractsData } from "@/contexts/ContractsDataContext";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { formatCPF, formatTelefoneBR } from "@/lib/brFormat";

export default function AdminCreateCliente() {
  const navigate = useNavigate();
  const { createClienteManual, ready, loading } = useContractsData();

  const [nome, setNome] = useState("");
  const [criarAcesso, setCriarAcesso] = useState(true);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [contato1, setContato1] = useState("");
  const [contato2, setContato2] = useState("");
  const [enderecoResidencial, setEnderecoResidencial] = useState("");
  const [enderecoTrabalho, setEnderecoTrabalho] = useState("");
  const [salario, setSalario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(goToContract: boolean) {
    if (submitting) return;

    if (isSupabaseConfigured && criarAcesso) {
      if (!senha) {
        toast.error("Defina a senha do cliente para o acesso à conta.");
        return;
      }
      if (senha !== confirmarSenha) {
        toast.error("A confirmação da senha não confere.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const id = await createClienteManual(
        {
          nome,
          cpf,
          email,
          telefone,
          estadoCivil: estadoCivil || undefined,
          instagram: "",
          contato1,
          contato2,
          enderecoResidencial,
          enderecoTrabalho,
          salario,
          dependentes: "",
          tipoMoradia: undefined,
          outrasRendas: "",
        },
        isSupabaseConfigured && criarAcesso
          ? { portalPassword: senha }
          : undefined,
      );
      if (!id) return;
      if (goToContract) {
        navigate(`/admin/cliente/${id}/contrato/novo`);
      } else {
        navigate(`/admin/cliente/${id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/admin">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Novo cliente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Os mesmos dados do cadastro do site: obrigatório apenas o{" "}
            <span className="text-foreground font-medium">nome</span>. Com
            Supabase, você pode já criar o login do cliente (e-mail + senha) para
            acessar como no cadastro público.
          </p>
          {!isSupabaseConfigured && (
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-2">
              Supabase não configurado: o cliente será salvo só na base local,
              sem conta de login.
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-6">
        <h2 className="font-semibold text-primary flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Dados pessoais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isSupabaseConfigured && (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 sm:col-span-2">
              <Checkbox
                id="ac-portal"
                checked={criarAcesso}
                onCheckedChange={(v) => setCriarAcesso(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="ac-portal"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Criar acesso à área do cliente
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cria usuário no Auth, perfil aprovado e vínculo com esta ficha.
                  O cliente entra na tela de login com este e-mail ou o nome
                  completo (se não houver homônimos) e a senha que você definir.
                </p>
              </div>
            </div>
          )}
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="ac-nome">Nome completo *</Label>
            <Input
              id="ac-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Obrigatório"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ac-cpf">CPF</Label>
            <Input
              id="ac-cpf"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="Opcional"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ac-email">
              E-mail
              {isSupabaseConfigured && criarAcesso ? " *" : ""}
            </Label>
            <Input
              id="ac-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                isSupabaseConfigured && criarAcesso
                  ? "Obrigatório para o login"
                  : "Opcional"
              }
              autoComplete="email"
            />
          </div>
          {isSupabaseConfigured && criarAcesso && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ac-senha">Senha *</Label>
                <Input
                  id="ac-senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mín. 8 caracteres, 1 maiúscula, 1 especial"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac-senha2">Confirmar senha *</Label>
                <Input
                  id="ac-senha2"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="ac-tel">Telefone</Label>
            <Input
              id="ac-tel"
              value={telefone}
              onChange={(e) => setTelefone(formatTelefoneBR(e.target.value))}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label>Estado civil</Label>
            <Select
              value={estadoCivil || "__none__"}
              onValueChange={(v) =>
                setEstadoCivil(v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Não informado</SelectItem>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ac-c1">Contato de confiança 1</Label>
            <Input
              id="ac-c1"
              value={contato1}
              onChange={(e) => setContato1(e.target.value)}
              placeholder="Opcional — Nome e telefone"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ac-c2">Contato de confiança 2</Label>
            <Input
              id="ac-c2"
              value={contato2}
              onChange={(e) => setContato2(e.target.value)}
              placeholder="Opcional — Nome e telefone"
            />
          </div>
        </div>

        <h2 className="font-semibold text-primary pt-2">Endereços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ac-er">Residencial</Label>
            <Input
              id="ac-er"
              value={enderecoResidencial}
              onChange={(e) => setEnderecoResidencial(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ac-et">Trabalho</Label>
            <Input
              id="ac-et"
              value={enderecoTrabalho}
              onChange={(e) => setEnderecoTrabalho(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>

        <h2 className="font-semibold text-primary pt-2">Financeiro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ac-sal">Salário</Label>
            <Input
              id="ac-sal"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => handleCreate(false)}
        >
          Salvar e ver ficha
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={() => handleCreate(true)}
        >
          Salvar e novo contrato
        </Button>
      </div>
    </div>
  );
}
