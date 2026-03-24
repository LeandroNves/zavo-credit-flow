import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setClienteAtualId } from "@/lib/clienteSession";

export default function Login() {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 md:left-8 md:top-8"
        onClick={() => navigate("/")}
        aria-label="Voltar para a landing page"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-8 space-y-6">
          <h1 className="text-2xl font-bold text-primary text-center">Acesse sua conta</h1>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full"
              type="button"
              onClick={() => {
                setClienteAtualId("1");
                navigate("/cliente");
              }}
            >
              Entrar
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/admin/login")}>
              Entrar como Admin
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-secondary font-medium hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
