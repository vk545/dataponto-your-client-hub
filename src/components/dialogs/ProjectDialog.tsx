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

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  responsible: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["idea", "planning", "executing", "review", "completed"]),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  due_date: z.string().optional(),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: {
    id: string;
    name: string;
    description: string | null;
    responsible: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    status: "idea" | "planning" | "executing" | "review" | "completed";
    start_date: string;
    due_date: string | null;
    observations: string | null;
  } | null;
  onSuccess: () => void;
  onDelete?: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
  onDelete,
}: ProjectDialogProps) {
  const { user } = useAuth();
  const isEditing = !!project;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      responsible: "",
      priority: "medium",
      status: "idea",
      start_date: new Date().toISOString().split("T")[0],
      due_date: "",
      observations: "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || "",
        responsible: project.responsible || "",
        priority: project.priority,
        status: project.status,
        start_date: project.start_date,
        due_date: project.due_date || "",
        observations: project.observations || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        responsible: "",
        priority: "medium",
        status: "idea",
        start_date: new Date().toISOString().split("T")[0],
        due_date: "",
        observations: "",
      });
    }
  }, [project, form, open]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    const payload = {
      name: data.name,
      description: data.description || null,
      responsible: data.responsible || null,
      priority: data.priority,
      status: data.status,
      start_date: data.start_date,
      due_date: data.due_date || null,
      observations: data.observations || null,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id);

      if (error) {
        toast.error("Erro ao atualizar projeto");
      } else {
        toast.success("Projeto atualizado");
        onSuccess();
      }
    } else {
      const { error } = await supabase
        .from("projects")
        .insert({ ...payload, user_id: user.id });

      if (error) {
        toast.error("Erro ao criar projeto");
      } else {
        toast.success("Projeto criado");
        onSuccess();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do projeto" />
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
                    <Textarea {...field} placeholder="Descreva o projeto..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do responsável" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="idea">Ideia</SelectItem>
                      <SelectItem value="planning">Planejamento</SelectItem>
                      <SelectItem value="executing">Em Execução</SelectItem>
                      <SelectItem value="review">Em Revisão</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Limite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações adicionais..." />
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
