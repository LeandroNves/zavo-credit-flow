import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export default function RegisterSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="bg-card rounded-lg border shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Cadastro enviado!</h1>
          <p className="text-muted-foreground text-sm">
            Sua senha foi registrada com segurança no Supabase Auth (hash no servidor — não
            armazenamos a senha em texto no banco de dados da aplicação).
          </p>
          <p className="text-muted-foreground">
            A análise é feita em até <strong>72h úteis</strong> após o envio de{" "}
            <strong>todos</strong> os documentos.
          </p>
          <p className="text-muted-foreground text-sm">
            Você já pode acompanhar o status da análise na área logada.
          </p>
          {isSupabaseConfigured ? (
            <div className="flex flex-col gap-2 pt-2">
              <Button className="w-full" asChild>
                <Link to="/cadastro/aguardando">Ver status do cadastro</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Ir ao login</Link>
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button className="w-full mt-4">Voltar ao login</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
