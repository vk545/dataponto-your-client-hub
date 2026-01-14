import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Target, Clock, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("next_reminder", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const today = new Date();
  const in7Days = addDays(today, 7);

  const pendingEmails = clients.filter((c) => c.email_status === "pending").length;
  const activeGoals = goals.filter((g) => g.status === "in_progress" || g.status === "finishing").length;
  
  const upcomingReminders = clients.filter((c) => {
    if (!c.next_reminder) return false;
    const reminderDate = new Date(c.next_reminder);
    return isAfter(reminderDate, today) && isBefore(reminderDate, in7Days);
  });

  const goalsNearDeadline = goals.filter((g) => {
    if (g.status === "completed") return false;
    const dueDate = new Date(g.due_date);
    return isAfter(dueDate, today) && isBefore(dueDate, in7Days);
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      not_started: "bg-status-not-started/10 text-status-not-started border-status-not-started/20",
      in_progress: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
      finishing: "bg-warning/10 text-warning border-warning/20",
      completed: "bg-status-done/10 text-status-done border-status-done/20",
    };
    const labels: Record<string, string> = {
      not_started: "Não iniciada",
      in_progress: "Em andamento",
      finishing: "Finalizando",
      completed: "Concluída",
    };
    return (
      <Badge variant="outline" className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas atividades
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="E-mails Pendentes"
            value={clientsLoading ? "-" : pendingEmails}
            icon={Mail}
            variant="primary"
            description="Aguardando resposta"
          />
          <StatCard
            title="Metas em Andamento"
            value={goalsLoading ? "-" : activeGoals}
            icon={Target}
            variant="secondary"
            description="Em progresso"
          />
          <StatCard
            title="Próximos Lembretes"
            value={clientsLoading ? "-" : upcomingReminders.length}
            icon={Clock}
            variant="default"
            description="Nos próximos 7 dias"
          />
          <StatCard
            title="Metas Próximas do Prazo"
            value={goalsLoading ? "-" : goalsNearDeadline.length}
            icon={AlertTriangle}
            variant="warning"
            description="Atenção necessária"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos Lembretes */}
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">Próximos Lembretes de E-mail</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : upcomingReminders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum lembrete nos próximos 7 dias
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingReminders.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {client.next_reminder && formatDate(client.next_reminder)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metas Recentes */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">Metas em Destaque</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : goals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma meta cadastrada
                </p>
              ) : (
                <div className="space-y-4">
                  {goals
                    .filter((g) => g.status !== "completed")
                    .slice(0, 5)
                    .map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                            {goal.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Target className="h-5 w-5 text-secondary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{goal.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Prazo: {formatDate(goal.due_date)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(goal.status)}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
