import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Upload, Eye, EyeOff, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const steps = ["Dados Pessoais", "Endereço", "Financeiro", "Criar Senha"];

function FileUpload({ label, required, id }: { label: string; required?: boolean; id: string }) {
  const [file, setFile] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <input ref={ref} id={id} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name || null)} />
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${file ? 'border-success bg-success/5' : 'border-input hover:border-secondary'}`}
        onClick={() => ref.current?.click()}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-success text-sm font-medium">
            <Check className="h-4 w-4" /> {file}
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
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-success' : 'text-muted-foreground'}`}>
      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${met ? 'bg-success' : 'bg-muted'}`}>
        {met && <Check className="h-2 w-2 text-success-foreground" />}
      </div>
      {text}
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPass, setShowPass] = useState(false);

  const hasUpper = /[A-Z]/.test(senha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const hasLength = senha.length >= 8;
  const passwordsMatch = senha === confirmar && senha.length > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => step > 0 ? setStep(step - 1) : navigate("/login")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">Etapa {step + 1} de {steps.length}</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full transition-colors ${i <= step ? 'bg-secondary' : 'bg-muted'}`} />
              <p className={`text-xs mt-1 hidden sm:block ${i <= step ? 'text-secondary font-medium' : 'text-muted-foreground'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6 md:p-8">
          {/* ETAPA 1 */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo <span className="text-destructive">*</span></Label>
                  <Input placeholder="Seu nome completo" />
                </div>
                <div className="space-y-2">
                  <Label>CPF <span className="text-destructive">*</span></Label>
                  <Input placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone <span className="text-destructive">*</span></Label>
                  <Input placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instagram (opcional)</Label>
                  <Input placeholder="@seuinstagram" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUpload label="RG ou CNH" required id="rg" />
                <FileUpload label="Selfie com documento" required id="selfie" />
              </div>
              <h3 className="font-semibold text-primary pt-2">Contatos de Confiança <span className="text-destructive">*</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contato 1 (Nome e telefone)</Label>
                  <Input placeholder="Nome - (00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Contato 2 (Nome e telefone)</Label>
                  <Input placeholder="Nome - (00) 00000-0000" />
                </div>
              </div>
              <Button className="w-full" onClick={() => setStep(1)}>Próximo</Button>
            </div>
          )}

          {/* ETAPA 2 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Endereço</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Endereço Residencial <span className="text-destructive">*</span></Label>
                  <Input placeholder="Rua, número, bairro, cidade/UF" />
                </div>
                <div className="space-y-2">
                  <Label>Endereço de Trabalho <span className="text-destructive">*</span></Label>
                  <Input placeholder="Rua, número, bairro, cidade/UF" />
                </div>
                <FileUpload label="Comprovante de Endereço" required id="comprovante" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(2)}>Próximo</Button>
              </div>
            </div>
          )}

          {/* ETAPA 3 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Dados Financeiros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salário <span className="text-destructive">*</span></Label>
                  <Input placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Dependentes <span className="text-destructive">*</span></Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Moradia</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propria">Própria</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="financiada">Financiada</SelectItem>
                      <SelectItem value="familiar">Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Outras Rendas (opcional)</Label>
                  <Input placeholder="R$ 0,00 - Descrição" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FileUpload label="Holerite" required id="holerite" />
                <FileUpload label="Carteira de Trabalho" id="ctps" />
                <FileUpload label="Extrato Bancário" id="extrato" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Próximo</Button>
              </div>
            </div>
          )}

          {/* ETAPA 4 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">Criar Senha</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="Crie uma senha forte"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha <span className="text-destructive">*</span></Label>
                  <Input
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                  />
                  {confirmar && !passwordsMatch && (
                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground mb-1">Requisitos da senha:</p>
                  <PasswordRule met={hasLength} text="Mínimo de 8 caracteres" />
                  <PasswordRule met={hasUpper} text="1 letra maiúscula" />
                  <PasswordRule met={hasSpecial} text="1 caractere especial (!@#$&)" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
                <Button className="flex-1" onClick={() => navigate("/cadastro/sucesso")} disabled={!(hasUpper && hasSpecial && hasLength && passwordsMatch)}>
                  Finalizar Cadastro
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
