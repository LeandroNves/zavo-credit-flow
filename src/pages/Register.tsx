import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Upload, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { submitRegistration } from "@/lib/registerSubmit";
import { formatCPF, formatTelefoneBR } from "@/lib/brFormat";
import {
  clearRegistrationInterest,
  loadRegistrationInterest,
  type RegistrationCartSnapshot,
} from "@/lib/registrationInterest";

const steps = ["Produtos", "Dados Pessoais", "Endereço", "Financeiro", "Criar Senha"];

export type RegisterFormState = {
  interesseTipo: "produto";
  interesseCarrinho: RegistrationCartSnapshot | null;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  contato1: string;
  contato2: string;
  rg: File[];
  selfie: File[];
  enderecoResidencial: string;
  enderecoTrabalho: string;
  comprovante: File[];
  salario: string;
  holerite: File[];
  ctps: File[];
  extrato: File[];
  senha: string;
  confirmar: string;
};

const emptyForm: RegisterFormState = {
  interesseTipo: "produto",
  interesseCarrinho: null,
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  estadoCivil: "",
  contato1: "",
  contato2: "",
  rg: [],
  selfie: [],
  enderecoResidencial: "",
  enderecoTrabalho: "",
  comprovante: [],
  salario: "",
  holerite: [],
  ctps: [],
  extrato: [],
  senha: "",
  confirmar: "",
};

function isNonEmpty(s: string) {
  return s.trim().length > 0;
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function validateStepObjective(f: RegisterFormState): string | null {
  if (!f.interesseCarrinho || f.interesseCarrinho.items.length === 0) {
    return "Escolha um ou mais produtos antes de continuar com o cadastro.";
  }
  return null;
}

function validateStepPersonal(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.nome)) return "Informe o nome completo.";
  if (!isNonEmpty(f.cpf)) return "Informe o CPF.";
  if (!isNonEmpty(f.email)) return "Informe o e-mail.";
  if (!isValidEmail(f.email)) return "E-mail inválido.";
  if (!isNonEmpty(f.telefone)) return "Informe o telefone.";
  if (!isNonEmpty(f.estadoCivil)) return "Selecione o estado civil.";
  if (f.rg.length < 1) return "Envie o RG ou CNH (frente e verso; um arquivo por imagem).";
  if (f.selfie.length < 1)
    return "Envie a selfie com documento (frente/lado da foto).";
  if (!isNonEmpty(f.contato1)) return "Informe o contato de confiança 1.";
  if (!isNonEmpty(f.contato2)) return "Informe o contato de confiança 2.";
  return null;
}

function validateStepAddress(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.enderecoResidencial)) return "Informe o endereço residencial.";
  if (!isNonEmpty(f.enderecoTrabalho)) return "Informe o endereço de trabalho.";
  if (f.comprovante.length < 1)
    return "Envie o comprovante de endereço.";
  return null;
}

function validateStepFinancial(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.salario)) return "Informe o salário.";
  if (f.holerite.length < 1)
    return "Envie o holerite mais atual (frente).";
  return null;
}

function validateStepPassword(f: RegisterFormState): string | null {
  const hasUpper = /[A-Z]/.test(f.senha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(f.senha);
  const hasLength = f.senha.length >= 8;
  if (!hasLength) return "A senha deve ter no mínimo 8 caracteres.";
  if (!hasUpper) return "A senha deve ter pelo menos uma letra maiúscula.";
  if (!hasSpecial) return "A senha deve ter pelo menos um caractere especial.";
  if (f.senha !== f.confirmar) return "A confirmação da senha não confere.";
  return null;
}

function MultiFileUpload({
  label,
  hint,
  required,
  id,
  files,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  id: string;
  files: File[];
  onChange: (next: File[]) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const addFromList = (list: FileList | null) => {
    if (!list?.length) return;
    onChange([...files, ...Array.from(list)]);
  };
  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };
  const hasFiles = files.length > 0;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {hint ? (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      ) : null}
      <input
        ref={ref}
        id={id}
        type="file"
        className="hidden"
        disabled={disabled}
        multiple
        accept="image/*,.pdf,application/pdf"
        onChange={(e) => {
          addFromList(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed border-muted"
            : "cursor-pointer"
        } ${hasFiles ? "border-success bg-success/5" : "border-input hover:border-secondary"}`}
        onClick={() => !disabled && ref.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            ref.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
          <Upload className="h-5 w-5" />
          <span>Clique para adicionar arquivos (vários permitidos)</span>
        </div>
      </div>
      {hasFiles && (
        <ul className="space-y-1.5 rounded-md border bg-background p-2 text-sm">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}-${f.lastModified}`}
              className="flex items-center justify-between gap-2 text-foreground"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 text-xs"
                disabled={disabled}
                onClick={(ev) => {
                  ev.stopPropagation();
                  removeAt(i);
                }}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${met ? "text-success" : "text-muted-foreground"}`}
    >
      <div
        className={`w-3 h-3 rounded-full flex items-center justify-center ${met ? "bg-success" : "bg-muted"}`}
      >
        {met && <Check className="h-2 w-2 text-success-foreground" />}
      </div>
      {text}
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterFormState>(() => ({ ...emptyForm }));
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<RegisterFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const hasUpper = /[A-Z]/.test(form.senha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.senha);
  const hasLength = form.senha.length >= 8;
  const passwordsMatch = form.senha === form.confirmar && form.senha.length > 0;

  useEffect(() => {
    const { interestType, cart } = loadRegistrationInterest();
    if (cart && !form.interesseCarrinho) {
      setForm((prev) => ({
        ...prev,
        interesseTipo: "produto",
        interesseCarrinho: cart ?? null,
      }));
    }
  }, [form.interesseCarrinho]);

  function goNext(fromStep: number) {
    let err: string | null = null;
    if (fromStep === 0) err = validateStepObjective(form);
    else if (fromStep === 1) err = validateStepPersonal(form);
    else if (fromStep === 2) err = validateStepAddress(form);
    else if (fromStep === 3) err = validateStepFinancial(form);
    if (err) {
      toast.error(err);
      return;
    }
    setStep(fromStep + 1);
  }

  async function finalize() {
    const err = validateStepPassword(form);
    if (err) {
      toast.error(err);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      toast.error(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar o cadastro.",
      );
      return;
    }
    setSubmitting(true);
    const res = await submitRegistration(supabase, form);
    setSubmitting(false);
    if (res.ok === false) {
      toast.error(res.message);
      return;
    }
    toast.success("Cadastro enviado! Aguarde a análise da equipe.");
    clearRegistrationInterest();
    navigate("/cadastro/sucesso");
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate("/", { replace: true }))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            Etapa {step + 1} de {steps.length}
          </span>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${i <= step ? "bg-secondary" : "bg-muted"}`}
              />
              <p
                className={`text-xs mt-1 hidden sm:block ${i <= step ? "text-secondary font-medium" : "text-muted-foreground"}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Escolha seus produtos</h2>
              <p className="text-sm text-muted-foreground">
                Selecione um ou mais produtos para continuar com o cadastro.
              </p>

              <div className="rounded-lg border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-primary">Produtos selecionados</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ pathname: "/", hash: "#produtos" })}
                  >
                    Escolher produtos
                  </Button>
                </div>

                {form.interesseCarrinho?.items?.length ? (
                  <div className="space-y-2">
                    {form.interesseCarrinho.items.map((it, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        <span className="font-medium text-primary">{it.qty}x</span>{" "}
                        {it.name}
                        {it.color ? ` (${it.color})` : ""} —{" "}
                        <span className="font-medium text-primary">{it.months}x</span>{" "}
                        de{" "}
                        <span className="font-medium text-primary">{it.perInstallmentBRL}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Você ainda não selecionou produtos. Clique em “Escolher produtos”.
                  </p>
                )}
              </div>

              <Button type="button" className="w-full" onClick={() => goNext(0)}>
                Próximo
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    value={form.nome}
                    onChange={(e) => patch({ nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">
                    CPF <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => patch({ cpf: formatCPF(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">
                    Telefone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 0 0000-0000"
                    value={form.telefone}
                    onChange={(e) => patch({ telefone: formatTelefoneBR(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Estado civil <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.estadoCivil || undefined}
                    onValueChange={(v) => patch({ estadoCivil: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiFileUpload
                  label="RG ou CNH — frente e verso"
                  hint="Envie uma foto ou PDF da frente e outra do verso (pode selecionar vários arquivos de uma vez ou adicionar em cliques separados)."
                  required
                  id="rg"
                  files={form.rg}
                  onChange={(f) => patch({ rg: f })}
                />
                <MultiFileUpload
                  label="Selfie com documento — Frente ao lado da foto"
                  hint="Inclua imagem nítida com a foto do documento ao lado do rosto (apenas um lado)."
                  required
                  id="selfie"
                  files={form.selfie}
                  onChange={(f) => patch({ selfie: f })}
                />
              </div>
              <h3 className="font-semibold text-primary pt-2">
                Contatos de confiança{" "}
                <span className="text-destructive">*</span>
              </h3>
              <h4 className="text-sm text-muted-foreground">
              Os contatos devem ser de pessoas próximas de você!
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contato1">
                    Contato 1 (nome e telefone){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contato1"
                    placeholder="Nome - (00) 00000-0000"
                    value={form.contato1}
                    onChange={(e) => patch({ contato1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato2">
                    Contato 2 (nome e telefone){" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contato2"
                    placeholder="Nome - (00) 00000-0000"
                    value={form.contato2}
                    onChange={(e) => patch({ contato2: e.target.value })}
                  />
                </div>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => goNext(1)}
              >
                Próximo
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Endereço</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="end-res">
                    Endereço residencial completo e com CEP<span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end-res"
                    placeholder="Rua, número, bairro, cidade/UF"
                    value={form.enderecoResidencial}
                    onChange={(e) =>
                      patch({ enderecoResidencial: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-trab">
                    Endereço de trabalho completo e com CEP<span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end-trab"
                    placeholder="Rua, número, bairro, cidade/UF"
                    value={form.enderecoTrabalho}
                    onChange={(e) =>
                      patch({ enderecoTrabalho: e.target.value })
                    }
                  />
                </div>
                <MultiFileUpload
                  label="Comprovante de endereço"
                  hint="Conta, fatura ou contrato (apenas frente quando aplicável)."
                  required
                  id="comprovante"
                  files={form.comprovante}
                  onChange={(f) => patch({ comprovante: f })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => goNext(2)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Dados financeiros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salario">
                    Salário <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="salario"
                    placeholder="R$ 0,00"
                    value={form.salario}
                    onChange={(e) => patch({ salario: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MultiFileUpload
                  label="Holerite (mais atual) — frente"
                  hint="Envie apenas o holerite mais atual."
                  required
                  id="holerite"
                  files={form.holerite}
                  onChange={(f) => patch({ holerite: f })}
                />
                <MultiFileUpload
                  label="Carteira de trabalho"
                  hint="Opcional. Vários arquivos permitidos."
                  id="ctps"
                  files={form.ctps}
                  onChange={(f) => patch({ ctps: f })}
                />
                <MultiFileUpload
                  label="Extrato bancário"
                  hint="Extrato bancário dos 3 últimos meses APENAS EM CASO DE NÃO TER HOLERITE. Se tiver holerite não enviar extrato."
                  id="extrato"
                  files={form.extrato}
                  onChange={(f) => patch({ extrato: f })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => goNext(3)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Criar senha</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">
                    Senha <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPass ? "text" : "password"}
                      placeholder="Crie uma senha forte"
                      value={form.senha}
                      onChange={(e) => patch({ senha: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar">
                    Confirmar senha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmar"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={form.confirmar}
                    onChange={(e) => patch({ confirmar: e.target.value })}
                  />
                  {form.confirmar && !passwordsMatch && (
                    <p className="text-xs text-destructive">
                      As senhas não coincidem
                    </p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Requisitos da senha:
                  </p>
                  <PasswordRule met={hasLength} text="Mínimo de 8 caracteres" />
                  <PasswordRule met={hasUpper} text="1 letra maiúscula" />
                  <PasswordRule met={hasSpecial} text="1 caractere especial (!@#$&)" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(3)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => void finalize()}
                  disabled={
                    submitting ||
                    !(hasUpper && hasSpecial && hasLength && passwordsMatch)
                  }
                >
                  {submitting ? "Enviando…" : "Finalizar cadastro"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
