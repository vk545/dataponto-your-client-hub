import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Client {
  id?: string;
  name: string;
  email: string;
  email_status: "accepted" | "rejected" | "pending";
  reminder_days: number;
  notes: string;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (client: Omit<Client, "id">) => Promise<void>;
  loading?: boolean;
}

export function ClientDialog({ open, onOpenChange, client, onSave, loading }: ClientDialogProps) {
  const [formData, setFormData] = useState<Omit<Client, "id">>({
    name: "",
    email: "",
    email_status: "pending",
    reminder_days: 7,
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        email_status: client.email_status,
        reminder_days: client.reminder_days,
        notes: client.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        email_status: "pending",
        reminder_days: 7,
        notes: "",
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status do E-mail</Label>
            <Select
              value={formData.email_status}
              onValueChange={(value: "accepted" | "rejected" | "pending") =>
                setFormData({ ...formData, email_status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="accepted">Aceito</SelectItem>
                <SelectItem value="rejected">Recusado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder">Lembrete (dias)</Label>
            <Select
              value={formData.reminder_days.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, reminder_days: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas sobre o cliente..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-brand" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : client ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
