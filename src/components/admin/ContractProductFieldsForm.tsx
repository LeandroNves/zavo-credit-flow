import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContractProductFields } from "@/data/mockData";

type Props = {
  value: ContractProductFields;
  onChange: (next: ContractProductFields) => void;
  idPrefix?: string;
};

export function ContractProductFieldsForm({
  value,
  onChange,
  idPrefix = "prod",
}: Props) {
  const set = (key: keyof ContractProductFields, v: string) =>
    onChange({ ...value, [key]: v });

  const field = (
    key: keyof ContractProductFields,
    label: string,
    placeholder?: string,
    span2 = false,
  ) => (
    <label
      className={`block space-y-2 ${span2 ? "sm:col-span-2" : ""}`}
      htmlFor={`${idPrefix}-${key}`}
    >
      <span className="text-sm font-medium leading-none">{label}</span>
      <Input
        id={`${idPrefix}-${key}`}
        placeholder={placeholder}
        value={value[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  );

  return (
    <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0 min-w-0">
      {field("produtoCategoria", "Categoria do produto", "Ex.: Aparelho celular", true)}
      {field("produtoModelo", "Modelo", "Ex.: Apple iPhone 8 64GB")}
      {field("produtoCor", "Cor", "Ex.: Branco")}
      {field("produtoSerie", "Número de série")}
      {field("produtoImei", "IMEI 1")}
      {field("produtoImei2", "IMEI 2 (opcional)", "Deixe vazio se não houver")}
      {field("produtoEstado", "Estado (novo/usado)", "Ex.: Usado")}
      {field("produtoAcessorios", "Acessórios inclusos", "Ex.: Não")}
    </fieldset>
  );
}
