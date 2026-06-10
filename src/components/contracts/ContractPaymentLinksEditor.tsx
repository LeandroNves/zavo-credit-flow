import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContractPaymentLink } from "@/lib/contractPaymentLinks";
import { emptyPaymentLink } from "@/lib/contractPaymentLinks";

type Props = {
  value: ContractPaymentLink[];
  onChange: (next: ContractPaymentLink[]) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function ContractPaymentLinksEditor({
  value,
  onChange,
  disabled,
  idPrefix = "pay-link",
}: Props) {
  const links = value.length > 0 ? value : [emptyPaymentLink()];

  function patchAt(index: number, partial: Partial<ContractPaymentLink>) {
    const next = links.map((l, i) => (i === index ? { ...l, ...partial } : l));
    onChange(next);
  }

  function removeAt(index: number) {
    if (links.length <= 1) {
      onChange([emptyPaymentLink()]);
      return;
    }
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-primary">Links de pagamento</h3>
        <p className="mt-1 text-xs text-muted-foreground leading-snug">
          Cole os links do Asaas (acesso às parcelas). O nome aparece para o cliente em
          &quot;Para pagar&quot;; o botão abre o link em nova aba.
        </p>
      </div>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={`${idPrefix}-${index}`}
            className="rounded-xl border bg-muted/20 p-3 space-y-3 sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Link {index + 1}
              </span>
              {links.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-label-${index}`}>Nome exibido</Label>
              <Input
                id={`${idPrefix}-label-${index}`}
                placeholder='Ex.: Parcelas 1 até 18'
                value={link.label}
                disabled={disabled}
                onChange={(e) => patchAt(index, { label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-url-${index}`}>Link (URL Asaas)</Label>
              <Input
                id={`${idPrefix}-url-${index}`}
                type="url"
                placeholder="https://..."
                value={link.url}
                disabled={disabled}
                onChange={(e) => patchAt(index, { url: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={disabled}
        onClick={() => onChange([...links, emptyPaymentLink()])}
      >
        <Plus className="h-4 w-4" />
        Adicionar link
      </Button>
    </div>
  );
}
