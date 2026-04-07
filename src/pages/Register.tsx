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
import {
  clearRegistrationInterest,
  loadRegistrationInterest,
  saveRegistrationInterest,
  type RegistrationCartSnapshot,
  type RegistrationInterestType,
} from "@/lib/registrationInterest";

const steps = ["Objetivo", "Dados Pessoais", "Endereço", "Financeiro", "Criar Senha"];

export type RegisterFormState = {
  interesseTipo: RegistrationInterestType | "";
  interesseCarrinho: RegistrationCartSnapshot | null;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  instagram: string;
  contato1: string;
  contato2: string;
  rg: File[];
  selfie: File[];
  enderecoResidencial: string;
  enderecoTrabalho: string;
  comprovante: File[];
  salario: string;
  dependentes: string;
  tipoMoradia: string;
  outrasRendas: string;
  holerite: File[];
  ctps: File[];
  extrato: File[];
  senha: string;
  confirmar: string;
};

const emptyForm: RegisterFormState = {
  interesseTipo: "",
  interesseCarrinho: null,
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  estadoCivil: "",
  instagram: "",
  contato1: "",
  contato2: "",
  rg: [],
  selfie: [],
  enderecoResidencial: "",
  enderecoTrabalho: "",
  comprovante: [],
  salario: "",
  dependentes: "",
  tipoMoradia: "",
  outrasRendas: "",
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
  if (!f.interesseTipo) return "Selecione o que você deseja (Empréstimo, Produto ou Ambos).";
  if ((f.interesseTipo === "produto" || f.interesseTipo === "ambos") && (!f.interesseCarrinho || f.interesseCarrinho.items.length === 0)) {
    return "Você selecionou Produto, mas não escolheu nenhum item. Volte e selecione os produtos antes de continuar.";
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
    return "Envie a selfie com documento (inclua frente e verso do documento, se necessário em mais de um arquivo).";
  if (!isNonEmpty(f.contato1)) return "Informe o contato de confiança 1.";
  if (!isNonEmpty(f.contato2)) return "Informe o contato de confiança 2.";
  return null;
}

function validateStepAddress(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.enderecoResidencial)) return "Informe o endereço residencial.";
  if (!isNonEmpty(f.enderecoTrabalho)) return "Informe o endereço de trabalho.";
  if (f.comprovante.length < 1)
    return "Envie o comprovante de endereço (frente e verso, se couber em mais de um arquivo).";
  return null;
}

function validateStepFinancial(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.salario)) return "Informe o salário.";
  if (!isNonEmpty(f.dependentes)) return "Informe a quantidade de dependentes.";
  if (!isNonEmpty(f.tipoMoradia)) return "Selecione o tipo de moradia.";
  if (f.holerite.length < 1)
    return "Envie o holerite (mais de um arquivo se precisar mostrar frente e verso).";
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
    if (interestType && !form.interesseTipo) {
      setForm((prev) => ({
        ...prev,
        interesseTipo: interestType,
        interesseCarrinho: cart ?? null,
      }));
    }
  }, [form.interesseTipo]);

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
              <h2 className="text-xl font-bold text-primary">O que você deseja?</h2>
              <p className="text-sm text-muted-foreground">
                Escolha a opção abaixo para a equipe entender sua necessidade.
              </p>

              <div className="space-y-2">
                <Label>
                  Objetivo <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.interesseTipo || undefined}
                  onValueChange={(v) => {
                    const next = v as RegistrationInterestType;
                    patch({ interesseTipo: next });
                    saveRegistrationInterest({
                      interestType: next,
                      cart: form.interesseCarrinho,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emprestimo">Empréstimo</SelectItem>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(form.interesseTipo === "produto" || form.interesseTipo === "ambos") && (
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
              )}

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
                    onChange={(e) => patch({ cpf: e.target.value })}
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
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => patch({ telefone: e.target.value })}
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
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram (opcional)</Label>
                  <Input
                    id="instagram"
                    placeholder="@seuinstagram"
                    value={form.instagram}
                    onChange={(e) => patch({ instagram: e.target.value })}
                  />
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
                  label="Selfie com documento — frente e verso"
                  hint="Inclua imagens nítidas; se o verso do documento for obrigatório, envie também (vários arquivos permitidos)."
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
                  label="Comprovante de endereço — frente e verso"
                  hint="Conta, fatura ou contrato: frente e verso quando aplicável (vários arquivos)."
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
                <div className="space-y-2">
                  <Label htmlFor="dependentes">
                    Dependentes <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dependentes"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.dependentes}
                    onChange={(e) => patch({ dependentes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Tipo de moradia <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.tipoMoradia || undefined}
                    onValueChange={(v) => patch({ tipoMoradia: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propria">Própria</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="financiada">Financiada</SelectItem>
                      <SelectItem value="familiar">Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outras">Outras rendas (opcional)</Label>
                  <Input
                    id="outras"
                    placeholder="R$ 0,00 — descrição"
                    value={form.outrasRendas}
                    onChange={(e) => patch({ outrasRendas: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MultiFileUpload
                  label="Holerite — frente e verso se necessário"
                  hint="Um ou mais arquivos (ex.: duas páginas ou frente/verso)."
                  required
                  id="holerite"
                  files={form.holerite}
                  onChange={(f) => patch({ holerite: f })}
                />
                <MultiFileUpload
                  label="Carteira de trabalho — frente e verso"
                  hint="Opcional. Vários arquivos permitidos."
                  id="ctps"
                  files={form.ctps}
                  onChange={(f) => patch({ ctps: f })}
                />
                <MultiFileUpload
                  label="Extrato bancário — frente e verso se necessário"
                  hint="Opcional. Vários arquivos permitidos."
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
