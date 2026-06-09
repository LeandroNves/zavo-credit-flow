import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DueDayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDueDay?: number;
  onConfirm: (dueDay: number) => void;
  title?: string;
  description?: string;
};

export function DueDayDialog({
  open,
  onOpenChange,
  initialDueDay = 10,
  onConfirm,
  title = "Dia de vencimento",
  description = "Escolha o dia do mês em que prefere pagar as parcelas.",
}: DueDayDialogProps) {
  const [dueDay, setDueDay] = useState(initialDueDay);

  useEffect(() => {
    if (open) setDueDay(initialDueDay);
  }, [open, initialDueDay]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="due-day-select">Vencimento (dia do mês)</Label>
          <Select value={String(dueDay)} onValueChange={(v) => setDueDay(Number(v))}>
            <SelectTrigger id="due-day-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <SelectItem key={d} value={String(d)}>
                  Dia {String(d).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              const d = Math.max(1, Math.min(31, Math.round(dueDay)));
              onConfirm(d);
              onOpenChange(false);
            }}
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
