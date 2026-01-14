import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Target, 
  Calendar,
  MoreVertical,
  CheckCircle2,
  Circle,
  Clock,
  Flag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Meta {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: string;
  prazoFinal: string;
  status: "nao_iniciada" | "em_andamento" | "finalizando" | "concluida";
  progresso: number;
}

export default function Metas() {
  // Dados mockados
  const metas: Meta[] = [
    {
      id: "1",
      titulo: "Campanha de Marketing Digital",
      descricao: "Criar e lançar campanha de marketing para o Q1 2026",
      dataInicio: "05/01/2026",
      prazoFinal: "28/02/2026",
      status: "em_andamento",
      progresso: 45,
    },
    {
      id: "2",
      titulo: "Redesign do Site",
      descricao: "Atualizar layout e UX do site principal",
      dataInicio: "01/01/2026",
      prazoFinal: "15/01/2026",
      status: "finalizando",
      progresso: 85,
    },
    {
      id: "3",
      titulo: "Newsletter Semanal",
      descricao: "Implementar sistema de newsletter automatizada",
      dataInicio: "10/01/2026",
      prazoFinal: "20/01/2026",
      status: "nao_iniciada",
      progresso: 0,
    },
    {
      id: "4",
      titulo: "Análise de Concorrência",
      descricao: "Pesquisa e análise detalhada dos principais concorrentes",
      dataInicio: "02/01/2026",
      prazoFinal: "10/01/2026",
      status: "concluida",
      progresso: 100,
    },
  ];

  const getStatusConfig = (status: Meta["status"]) => {
    const configs = {
      nao_iniciada: {
        icon: Circle,
        label: "Não iniciada",
        className: "bg-status-not-started/10 text-status-not-started border-status-not-started/20",
        progressColor: "bg-status-not-started",
      },
      em_andamento: {
        icon: Clock,
        label: "Em andamento",
        className: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
        progressColor: "bg-status-in-progress",
      },
      finalizando: {
        icon: Flag,
        label: "Finalizando",
        className: "bg-warning/10 text-warning border-warning/20",
        progressColor: "bg-warning",
      },
      concluida: {
        icon: CheckCircle2,
        label: "Concluída",
        className: "bg-status-done/10 text-status-done border-status-done/20",
        progressColor: "bg-status-done",
      },
    };
    return configs[status];
  };

  const stats = {
    total: metas.length,
    naoIniciadas: metas.filter((m) => m.status === "nao_iniciada").length,
    emAndamento: metas.filter((m) => m.status === "em_andamento").length,
    finalizando: metas.filter((m) => m.status === "finalizando").length,
    concluidas: metas.filter((m) => m.status === "concluida").length,
  };

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
          <Button className="gradient-brand hover:opacity-90 transition-opacity">
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
              {stats.naoIniciadas}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-status-in-progress">Em andamento</p>
            <p className="text-2xl font-display font-bold text-status-in-progress">
              {stats.emAndamento}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-warning">Finalizando</p>
            <p className="text-2xl font-display font-bold text-warning">
              {stats.finalizando}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-status-done">Concluídas</p>
            <p className="text-2xl font-display font-bold text-status-done">
              {stats.concluidas}
            </p>
          </Card>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metas.map((meta) => {
            const statusConfig = getStatusConfig(meta.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={meta.id} className="animate-slide-up hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-display">
                          {meta.titulo}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {meta.descricao}
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Alterar Status</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
                      <span className="font-medium">{meta.progresso}%</span>
                    </div>
                    <Progress value={meta.progresso} className="h-2" />
                  </div>

                  {/* Dates and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Início: {meta.dataInicio}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        <span>Prazo: {meta.prazoFinal}</span>
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
      </div>
    </AppLayout>
  );
}
