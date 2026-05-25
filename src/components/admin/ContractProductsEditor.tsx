import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractProductFieldsForm } from "@/components/admin/ContractProductFieldsForm";
import {
  emptyContractProductFields,
  type ContractProductFields,
} from "@/data/mockData";

type Props = {
  value: ContractProductFields[];
  onChange: (next: ContractProductFields[]) => void;
  idPrefix?: string;
};

export function ContractProductsEditor({
  value,
  onChange,
  idPrefix = "prod",
}: Props) {
  const list = value.length > 0 ? value : [emptyContractProductFields()];

  const setItem = (index: number, item: ContractProductFields) => {
    const next = [...list];
    next[index] = item;
    onChange(next);
  };

  const addProduct = () => {
    onChange([...list, emptyContractProductFields()]);
  };

  const removeProduct = (index: number) => {
    if (list.length <= 1) return;
    onChange(list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {list.map((item, index) => (
        <div
          key={`${idPrefix}-item-${index}`}
          className="rounded-lg border bg-muted/20 p-4 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-primary">
              Produto {index + 1}
            </p>
            {list.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removeProduct(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            ) : null}
          </div>
          <ContractProductFieldsForm
            value={item}
            onChange={(next) => setItem(index, next)}
            idPrefix={`${idPrefix}-${index}`}
          />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={addProduct}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar outro produto
      </Button>
    </div>
  );
}
