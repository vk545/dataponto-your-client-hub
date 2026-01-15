import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  appointment_date: z.string().min(1, "Data é obrigatória"),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().optional(),
  reminder_minutes: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: {
    id: string;
    title: string;
    description: string | null;
    appointment_date: string;
    start_time: string;
    end_time: string | null;
    reminder_minutes: number | null;
    location: string | null;
    notes: string | null;
  } | null;
  defaultDate?: Date;
  onSuccess: () => void;
  onDelete?: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  defaultDate,
  onSuccess,
  onDelete,
}: AppointmentDialogProps) {
  const { user } = useAuth();
  const isEditing = !!appointment;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      appointment_date: format(defaultDate || new Date(), "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "",
      reminder_minutes: "30",
      location: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (appointment) {
      form.reset({
        title: appointment.title,
        description: appointment.description || "",
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time.slice(0, 5),
        end_time: appointment.end_time?.slice(0, 5) || "",
        reminder_minutes: appointment.reminder_minutes?.toString() || "",
        location: appointment.location || "",
        notes: appointment.notes || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        appointment_date: format(defaultDate || new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "",
        reminder_minutes: "30",
        location: "",
        notes: "",
      });
    }
  }, [appointment, form, open, defaultDate]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    const payload = {
      title: data.title,
      description: data.description || null,
      appointment_date: data.appointment_date,
      start_time: data.start_time,
      end_time: data.end_time || null,
      reminder_minutes: data.reminder_minutes ? parseInt(data.reminder_minutes) : null,
      location: data.location || null,
      notes: data.notes || null,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", appointment.id);

      if (error) {
        toast.error("Erro ao atualizar compromisso");
      } else {
        toast.success("Compromisso atualizado");
        onSuccess();
      }
    } else {
      const { error } = await supabase
        .from("appointments")
        .insert({ ...payload, user_id: user.id });

      if (error) {
        toast.error("Erro ao criar compromisso");
      } else {
        toast.success("Compromisso criado");
        onSuccess();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Compromisso" : "Novo Compromisso"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Título do compromisso" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descrição..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appointment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Término</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Local do evento" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lembrete</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sem lembrete</SelectItem>
                        <SelectItem value="5">5 minutos antes</SelectItem>
                        <SelectItem value="15">15 minutos antes</SelectItem>
                        <SelectItem value="30">30 minutos antes</SelectItem>
                        <SelectItem value="60">1 hora antes</SelectItem>
                        <SelectItem value="1440">1 dia antes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anotações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Anotações..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{isEditing ? "Salvar" : "Criar"}</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
