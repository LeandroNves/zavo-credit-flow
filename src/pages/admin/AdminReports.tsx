import { Construction } from "lucide-react";

export default function AdminReports() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
        <Construction className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-primary">Relatórios</h1>
      <p className="text-muted-foreground max-w-md">
        Esta funcionalidade estará disponível em breve. Aqui você poderá visualizar relatórios de recebimentos, valores em aberto e atrasados com filtros por mês e ano.
      </p>
    </div>
  );
}
