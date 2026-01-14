import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalDialog } from "@/components/dialogs/GoalDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { 
  Plus, 
  Target, 
  Calendar,
  MoreVertical,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Pencil,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type GoalStatus = "not_started" | "in_progress" | "finishing" | "completed";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  due_date: string;
  status: GoalStatus;
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function Metas() {
  const { user, loading: authLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (goal: Omit<Goal, "id" | "created_by" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("goals").insert({
        ...goal,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDialogOpen(false);
      toast({ title: "Meta criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar meta", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...goal }: Partial<Goal> & { id: string }) => {
      const { error } = await supabase
        .from("goals")
        .update(goal)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDialogOpen(false);
      setSelectedGoal(null);
      toast({ title: "Meta atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar meta", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDeleteDialogOpen(false);
      setSelectedGoal(null);
      toast({ title: "Meta removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover meta", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = async (goalData: any) => {
    if (selectedGoal) {
      await updateMutation.mutateAsync({ id: selectedGoal.id, ...goalData });
    } else {
      await createMutation.mutateAsync(goalData);
    }
  };

  const getStatusConfig = (status: GoalStatus) => {
    const configs = {
      not_started: {
        icon: Circle,
        label: "Não iniciada",
        className: "bg-status-not-started/10 text-status-not-started border-status-not-started/20",
      },
      in_progress: {
        icon: Clock,
        label: "Em andamento",
        className: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
      },
      finishing: {
        icon: Flag,
        label: "Finalizando",
        className: "bg-warning/10 text-warning border-warning/20",
      },
      completed: {
        icon: CheckCircle2,
        label: "Concluída",
        className: "bg-status-done/10 text-status-done border-status-done/20",
      },
    };
    return configs[status];
  };

  const stats = {
    total: goals.length,
    notStarted: goals.filter((g) => g.status === "not_started").length,
    inProgress: goals.filter((g) => g.status === "in_progress").length,
    finishing: goals.filter((g) => g.status === "finishing").length,
    completed: goals.filter((g) => g.status === "completed").length,
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <Skeleton className="h-10 w-48 mb-8" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Metas
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize suas ideias, projetos e objetivos
            </p>
          </div>
          <Button 
            className="gradient-brand hover:opacity-90 transition-opacity"
            onClick={() => {
              setSelectedGoal(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-display font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-status-not-started">Não iniciadas</p>
            <p className="text-2xl font-display font-bold text-status-not-started">
              {stats.notStarted}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-status-in-progress">Em andamento</p>
            <p className="text-2xl font-display font-bold text-status-in-progress">
              {stats.inProgress}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-warning">Finalizando</p>
            <p className="text-2xl font-display font-bold text-warning">
              {stats.finishing}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-status-done">Concluídas</p>
            <p className="text-2xl font-display font-bold text-status-done">
              {stats.completed}
            </p>
          </Card>
        </div>

        {/* Goals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma meta cadastrada</p>
            <Button 
              className="mt-4 gradient-brand"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira meta
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const statusConfig = getStatusConfig(goal.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={goal.id} className="animate-slide-up hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-display">
                            {goal.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {goal.description || "Sem descrição"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedGoal(goal);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>

                    {/* Dates and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Início: {formatDate(goal.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Flag className="h-3 w-3" />
                          <span>Prazo: {formatDate(goal.due_date)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        <GoalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          goal={selectedGoal}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        />

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => deleteMutation.mutateAsync(selectedGoal!.id)}
          title="Excluir Meta"
          description={`Tem certeza que deseja excluir "${selectedGoal?.title}"? Esta ação não pode ser desfeita.`}
          loading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
