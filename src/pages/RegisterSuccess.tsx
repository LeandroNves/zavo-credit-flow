import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import mascote from "@/assets/mascote.png";

export default function RegisterSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <img src={mascote} alt="Mascote Zavo" className="w-36 mx-auto" />
        <div className="bg-card rounded-lg border shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Cadastro Enviado!</h1>
          <p className="text-muted-foreground">
            A análise é feita em até <strong>72h úteis</strong> após o envio de <strong>TODOS</strong> os documentos.
          </p>
          <p className="text-muted-foreground">Aguarde que retornaremos.</p>
          <Link to="/login">
            <Button className="w-full mt-4">Voltar ao Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
