import { Package } from "lucide-react";
import {
  loadRegistrationInterest,
  type RegistrationCartSnapshot,
} from "@/lib/registrationInterest";

export function RegistrationInterestCard({
  cart,
  className = "",
}: {
  cart?: RegistrationCartSnapshot | null;
  className?: string;
}) {
  const snapshot = cart ?? loadRegistrationInterest().cart;
  if (!snapshot?.items?.length) return null;

  return (
    <div
      className={`rounded-xl border border-secondary/20 bg-secondary/5 p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-secondary shrink-0" />
        <h2 className="text-sm font-bold text-primary">Produto selecionado</h2>
      </div>
      <ul className="space-y-2.5">
        {snapshot.items.map((item, idx) => (
          <li
            key={`${item.productId}-${idx}`}
            className="rounded-lg border bg-card px-3 py-2.5 text-sm"
          >
            <p className="font-semibold text-primary">{item.name}</p>
            {item.model && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.model}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {item.downPayment} • Venc. dia {String(item.dueDay).padStart(2, "0")}
            </p>
            <p className="mt-1 font-semibold text-secondary">
              {item.months}x de {item.perInstallmentBRL}
            </p>
            {item.qty > 1 && (
              <p className="text-xs text-muted-foreground">Quantidade: {item.qty}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
