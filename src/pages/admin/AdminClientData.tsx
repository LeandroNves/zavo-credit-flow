import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, MapPin, DollarSign, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockClientes } from "@/data/mockData";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function AdminClientData() {
  const { id } = useParams();
  const cliente = mockClientes.find((c) => c.id === id);

  if (!cliente) return <div className="text-center py-12 text-muted-foreground">Cliente não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/admin/cliente/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold text-primary">Dados de {cliente.nome}</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2"><Pencil className="h-3 w-3" /> Editar</Button>
          <Button size="sm" variant="destructive" className="gap-2"><Trash2 className="h-3 w-3" /> Excluir</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><User className="h-5 w-5" /> Informações Pessoais</h2>
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
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Residencial" value={cliente.enderecoResidencial} />
          <Field label="Trabalho" value={cliente.enderecoTrabalho} />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-primary flex items-center gap-2"><DollarSign className="h-5 w-5" /> Financeiro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Salário" value={cliente.salario} />
          <Field label="Dependentes" value={cliente.dependentes} />
          <Field label="Tipo de Moradia" value={cliente.tipoMoradia} />
          <Field label="Outras Rendas" value={cliente.outrasRendas} />
        </div>
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
