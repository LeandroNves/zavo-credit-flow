import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockCadastrosPendentes, type CadastroPendente } from "@/data/mockData";
import { toast } from "sonner";

export default function AdminPendingRegistrations() {
  const [pendentes, setPendentes] = useState(mockCadastrosPendentes);
  const [selected, setSelected] = useState<CadastroPendente | null>(null);

  const handleApprove = (id: string) => {
    setPendentes(pendentes.filter((p) => p.id !== id));
    setSelected(null);
    toast.success("Cadastro aprovado com sucesso!");
  };

  const handleReject = (id: string) => {
    setPendentes(pendentes.filter((p) => p.id !== id));
    setSelected(null);
    toast.error("Cadastro reprovado.");
  };

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Análise de Cadastro</h1>
          <Button variant="outline" onClick={() => setSelected(null)}>Voltar à lista</Button>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ["Nome", selected.nome],
              ["CPF", selected.cpf],
              ["Email", selected.email],
              ["Telefone", selected.telefone],
              ["Estado Civil", selected.estadoCivil],
              ["Instagram", selected.instagram],
              ["Contato 1", selected.contato1],
              ["Contato 2", selected.contato2],
            ].map(([l, v]) => (
              <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="text-sm font-medium">{v || "—"}</p></div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-xs text-muted-foreground">Residencial</p><p className="text-sm font-medium">{selected.enderecoResidencial}</p></div>
            <div><p className="text-xs text-muted-foreground">Trabalho</p><p className="text-sm font-medium">{selected.enderecoTrabalho}</p></div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Financeiro</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div><p className="text-xs text-muted-foreground">Salário</p><p className="text-sm font-medium">{selected.salario}</p></div>
            <div><p className="text-xs text-muted-foreground">Dependentes</p><p className="text-sm font-medium">{selected.dependentes}</p></div>
            <div><p className="text-xs text-muted-foreground">Moradia</p><p className="text-sm font-medium">{selected.tipoMoradia}</p></div>
            <div><p className="text-xs text-muted-foreground">Outras Rendas</p><p className="text-sm font-medium">{selected.outrasRendas || "—"}</p></div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-primary">Documentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["RG/CNH", "Selfie com documento", "Comprovante de endereço", "Holerite"].map((doc) => (
              <a key={doc} href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank" rel="noreferrer" className="border rounded-lg p-4 text-center hover:bg-muted/30 transition-colors">
                <p className="text-xs text-muted-foreground">{doc}</p>
                <p className="text-xs text-secondary font-medium mt-1">Abrir em nova aba ↗</p>
              </a>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 gap-2 bg-success hover:bg-success/90" onClick={() => handleApprove(selected.id)}>
            <CheckCircle className="h-4 w-4" /> Aprovar
          </Button>
          <Button variant="destructive" className="flex-1 gap-2" onClick={() => handleReject(selected.id)}>
            <XCircle className="h-4 w-4" /> Reprovar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Cadastros Pendentes</h1>

      {pendentes.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">Nenhum cadastro pendente.</div>
      ) : (
        <div className="grid gap-4">
          {pendentes.map((p) => (
            <div key={p.id} className="bg-card rounded-lg border p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{p.nome}</h3>
                    <p className="text-sm text-muted-foreground">{p.cpf} • Cadastrado em {p.dataCadastro}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setSelected(p)}>Analisar</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
