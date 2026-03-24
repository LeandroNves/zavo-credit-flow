import { useRef, useState } from "react";
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

const steps = ["Dados Pessoais", "Endereço", "Financeiro", "Criar Senha"];

type RegisterFormState = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  estadoCivil: string;
  instagram: string;
  contato1: string;
  contato2: string;
  rg: File | null;
  selfie: File | null;
  enderecoResidencial: string;
  enderecoTrabalho: string;
  comprovante: File | null;
  salario: string;
  dependentes: string;
  tipoMoradia: string;
  outrasRendas: string;
  holerite: File | null;
  ctps: File | null;
  extrato: File | null;
  senha: string;
  confirmar: string;
};

const emptyForm: RegisterFormState = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  estadoCivil: "",
  instagram: "",
  contato1: "",
  contato2: "",
  rg: null,
  selfie: null,
  enderecoResidencial: "",
  enderecoTrabalho: "",
  comprovante: null,
  salario: "",
  dependentes: "",
  tipoMoradia: "",
  outrasRendas: "",
  holerite: null,
  ctps: null,
  extrato: null,
  senha: "",
  confirmar: "",
};

function isNonEmpty(s: string) {
  return s.trim().length > 0;
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function validateStep0(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.nome)) return "Informe o nome completo.";
  if (!isNonEmpty(f.cpf)) return "Informe o CPF.";
  if (!isNonEmpty(f.email)) return "Informe o e-mail.";
  if (!isValidEmail(f.email)) return "E-mail inválido.";
  if (!isNonEmpty(f.telefone)) return "Informe o telefone.";
  if (!isNonEmpty(f.estadoCivil)) return "Selecione o estado civil.";
  if (!f.rg) return "Envie o RG ou CNH.";
  if (!f.selfie) return "Envie a selfie com documento.";
  if (!isNonEmpty(f.contato1)) return "Informe o contato de confiança 1.";
  if (!isNonEmpty(f.contato2)) return "Informe o contato de confiança 2.";
  return null;
}

function validateStep1(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.enderecoResidencial)) return "Informe o endereço residencial.";
  if (!isNonEmpty(f.enderecoTrabalho)) return "Informe o endereço de trabalho.";
  if (!f.comprovante) return "Envie o comprovante de endereço.";
  return null;
}

function validateStep2(f: RegisterFormState): string | null {
  if (!isNonEmpty(f.salario)) return "Informe o salário.";
  if (!isNonEmpty(f.dependentes)) return "Informe a quantidade de dependentes.";
  if (!isNonEmpty(f.tipoMoradia)) return "Selecione o tipo de moradia.";
  if (!f.holerite) return "Envie o holerite.";
  return null;
}

function validateStep3(f: RegisterFormState): string | null {
  const hasUpper = /[A-Z]/.test(f.senha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(f.senha);
  const hasLength = f.senha.length >= 8;
  if (!hasLength) return "A senha deve ter no mínimo 8 caracteres.";
  if (!hasUpper) return "A senha deve ter pelo menos uma letra maiúscula.";
  if (!hasSpecial) return "A senha deve ter pelo menos um caractere especial.";
  if (f.senha !== f.confirmar) return "A confirmação da senha não confere.";
  return null;
}

function FileUpload({
  label,
  required,
  id,
  file,
  onChange,
  disabled,
}: {
  label: string;
  required?: boolean;
  id: string;
  file: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <input
        ref={ref}
        id={id}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          onChange(next);
        }}
      />
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed border-muted"
            : "cursor-pointer"
        } ${file ? "border-success bg-success/5" : "border-input hover:border-secondary"}`}
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
        {file ? (
          <div className="flex items-center justify-center gap-2 text-success text-sm font-medium">
            <Check className="h-4 w-4" /> {file.name}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground text-sm">
            <Upload className="h-5 w-5" />
            <span>Clique para enviar</span>
          </div>
        )}
      </div>
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

  const patch = (partial: Partial<RegisterFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const hasUpper = /[A-Z]/.test(form.senha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.senha);
  const hasLength = form.senha.length >= 8;
  const passwordsMatch = form.senha === form.confirmar && form.senha.length > 0;

  function goNext(fromStep: number) {
    let err: string | null = null;
    if (fromStep === 0) err = validateStep0(form);
    else if (fromStep === 1) err = validateStep1(form);
    else if (fromStep === 2) err = validateStep2(form);
    if (err) {
      toast.error(err);
      return;
    }
    setStep(fromStep + 1);
  }

  function finalize() {
    const err = validateStep3(form);
    if (err) {
      toast.error(err);
      return;
    }
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
            onClick={() => (step > 0 ? setStep(step - 1) : navigate("/login"))}
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
                <FileUpload
                  label="RG ou CNH"
                  required
                  id="rg"
                  file={form.rg}
                  onChange={(f) => patch({ rg: f })}
                />
                <FileUpload
                  label="Selfie com documento"
                  required
                  id="selfie"
                  file={form.selfie}
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
                onClick={() => goNext(0)}
              >
                Próximo
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Endereço</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="end-res">
                    Endereço residencial <span className="text-destructive">*</span>
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
                    Endereço de trabalho <span className="text-destructive">*</span>
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
                <FileUpload
                  label="Comprovante de endereço"
                  required
                  id="comprovante"
                  file={form.comprovante}
                  onChange={(f) => patch({ comprovante: f })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(0)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => goNext(1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
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
                <FileUpload
                  label="Holerite"
                  required
                  id="holerite"
                  file={form.holerite}
                  onChange={(f) => patch({ holerite: f })}
                />
                <FileUpload
                  label="Carteira de trabalho"
                  id="ctps"
                  file={form.ctps}
                  onChange={(f) => patch({ ctps: f })}
                />
                <FileUpload
                  label="Extrato bancário"
                  id="extrato"
                  file={form.extrato}
                  onChange={(f) => patch({ extrato: f })}
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
                  onClick={() => setStep(2)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={finalize}
                  disabled={
                    !(hasUpper && hasSpecial && hasLength && passwordsMatch)
                  }
                >
                  Finalizar cadastro
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
