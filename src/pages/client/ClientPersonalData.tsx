import { mockClientes } from "@/data/mockData";
import { User, MapPin, DollarSign, FileText } from "lucide-react";

const cliente = mockClientes[0];

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border p-5 space-y-4">
      <h2 className="font-semibold text-primary flex items-center gap-2">
        <Icon className="h-5 w-5" /> {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function ClientPersonalData() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Dados Pessoais</h1>

      <Section icon={User} title="Informações Pessoais">
        <Field label="Nome" value={cliente.nome} />
        <Field label="CPF" value={cliente.cpf} />
        <Field label="Email" value={cliente.email} />
        <Field label="Telefone" value={cliente.telefone} />
        <Field label="Estado Civil" value={cliente.estadoCivil} />
        <Field label="Instagram" value={cliente.instagram} />
        <Field label="Contato 1" value={cliente.contato1} />
        <Field label="Contato 2" value={cliente.contato2} />
      </Section>

      <Section icon={MapPin} title="Endereços">
        <Field label="Residencial" value={cliente.enderecoResidencial} />
        <Field label="Trabalho" value={cliente.enderecoTrabalho} />
      </Section>

      <Section icon={DollarSign} title="Financeiro">
        <Field label="Salário" value={cliente.salario} />
        <Field label="Dependentes" value={cliente.dependentes} />
        <Field label="Tipo de Moradia" value={cliente.tipoMoradia} />
        <Field label="Outras Rendas" value={cliente.outrasRendas} />
      </Section>

      <Section icon={FileText} title="Documentos">
        <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["RG/CNH", "Selfie com documento", "Comprovante de endereço", "Holerite"].map((doc) => (
            <div key={doc} className="border rounded-lg p-3 text-center">
              <FileText className="h-8 w-8 mx-auto text-secondary mb-2" />
              <p className="text-xs text-muted-foreground">{doc}</p>
              <p className="text-xs font-medium text-success mt-1">Enviado ✓</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
