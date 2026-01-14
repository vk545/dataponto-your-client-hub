import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Target, Clock, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

export default function Dashboard() {
  // Dados mockados para demonstração
  const stats = {
    emailsPendentes: 8,
    metasEmAndamento: 3,
    proximosLembretes: 5,
    metasProximasPrazo: 2,
  };

  const proximosLembretes = [
    { cliente: "João Silva", dias: 2, tipo: "Primeiro contato" },
    { cliente: "Maria Santos", dias: 5, tipo: "Follow-up" },
    { cliente: "Pedro Costa", dias: 7, tipo: "Renovação" },
  ];

  const metasRecentes = [
    { titulo: "Campanha de Natal", status: "em_andamento", prazo: "20/01/2026" },
    { titulo: "Rebranding Site", status: "finalizando", prazo: "15/01/2026" },
    { titulo: "Newsletter Mensal", status: "nao_iniciada", prazo: "30/01/2026" },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      nao_iniciada: "bg-status-not-started/10 text-status-not-started border-status-not-started/20",
      em_andamento: "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
      finalizando: "bg-warning/10 text-warning border-warning/20",
      concluida: "bg-status-done/10 text-status-done border-status-done/20",
    };
    const labels = {
      nao_iniciada: "Não iniciada",
      em_andamento: "Em andamento",
      finalizando: "Finalizando",
      concluida: "Concluída",
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
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
            value={stats.emailsPendentes}
            icon={Mail}
            variant="primary"
            description="Aguardando envio"
          />
          <StatCard
            title="Metas em Andamento"
            value={stats.metasEmAndamento}
            icon={Target}
            variant="secondary"
            description="Em progresso"
          />
          <StatCard
            title="Próximos Lembretes"
            value={stats.proximosLembretes}
            icon={Clock}
            variant="default"
            description="Nos próximos 7 dias"
          />
          <StatCard
            title="Metas Próximas do Prazo"
            value={stats.metasProximasPrazo}
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
              <div className="space-y-4">
                {proximosLembretes.map((lembrete, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lembrete.cliente}</p>
                        <p className="text-sm text-muted-foreground">{lembrete.tipo}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Em {lembrete.dias} dias
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metas Recentes */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-display">Metas Recentes</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metasRecentes.map((meta, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        {meta.status === "concluida" ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Target className="h-5 w-5 text-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{meta.titulo}</p>
                        <p className="text-sm text-muted-foreground">Prazo: {meta.prazo}</p>
                      </div>
                    </div>
                    {getStatusBadge(meta.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
