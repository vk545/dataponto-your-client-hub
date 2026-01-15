import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, AlertTriangle, CheckCircle, Target, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, isPast, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

type ProjectStatus = "idea" | "planning" | "executing" | "review" | "completed";
type PriorityLevel = "low" | "medium" | "high" | "urgent";

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  due_date: string | null;
  responsible: string | null;
}

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  start_time: string;
  reminder_minutes: number | null;
}

interface Goal {
  id: string;
  title: string;
  due_date: string;
  status: string;
  progress: number;
}

interface DeadlineItem {
  id: string;
  title: string;
  type: "project" | "appointment" | "goal";
  date: string;
  time?: string;
  urgency: "overdue" | "today" | "urgent" | "soon" | "normal";
  status?: string;
  progress?: number;
}

const urgencyConfig = {
  overdue: { label: "Atrasado", color: "bg-red-500 text-white", icon: AlertTriangle },
  today: { label: "Hoje", color: "bg-orange-500 text-white", icon: Clock },
  urgent: { label: "Urgente", color: "bg-yellow-500 text-black", icon: AlertTriangle },
  soon: { label: "Em breve", color: "bg-blue-500 text-white", icon: Calendar },
  normal: { label: "Normal", color: "bg-gray-500 text-white", icon: Calendar },
};

const typeConfig = {
  project: { label: "Projeto", icon: Target, color: "text-purple-500" },
  appointment: { label: "Compromisso", icon: CalendarDays, color: "text-blue-500" },
  goal: { label: "Meta", icon: CheckCircle, color: "text-green-500" },
};

export default function Prazos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const getUrgency = (dateStr: string): DeadlineItem["urgency"] => {
    const date = new Date(dateStr);
    const days = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) return "overdue";
    if (isToday(date)) return "today";
    if (days <= 3) return "urgent";
    if (days <= 7) return "soon";
    return "normal";
  };

  const fetchDeadlines = async () => {
    if (!user) return;

    const items: DeadlineItem[] = [];

    // Fetch projects with due dates
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status, priority, due_date, responsible")
      .not("due_date", "is", null)
      .neq("status", "completed");

    projects?.forEach((project) => {
      if (project.due_date) {
        items.push({
          id: project.id,
          title: project.name,
          type: "project",
          date: project.due_date,
          urgency: getUrgency(project.due_date),
          status: project.status,
        });
      }
    });

    // Fetch upcoming appointments
    const today = format(new Date(), "yyyy-MM-dd");
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, title, appointment_date, start_time, reminder_minutes")
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true });

    appointments?.forEach((apt) => {
      items.push({
        id: apt.id,
        title: apt.title,
        type: "appointment",
        date: apt.appointment_date,
        time: apt.start_time,
        urgency: getUrgency(apt.appointment_date),
      });
    });

    // Fetch goals with due dates
    const { data: goals } = await supabase
      .from("goals")
      .select("id, title, due_date, status, progress")
      .neq("status", "completed");

    goals?.forEach((goal) => {
      items.push({
        id: goal.id,
        title: goal.title,
        type: "goal",
        date: goal.due_date,
        urgency: getUrgency(goal.due_date),
        status: goal.status,
        progress: goal.progress,
      });
    });

    // Sort by date
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDeadlines(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeadlines();
  }, [user]);

  const filteredDeadlines = deadlines.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "overdue") return item.urgency === "overdue";
    if (activeTab === "today") return item.urgency === "today";
    if (activeTab === "urgent") return item.urgency === "urgent" || item.urgency === "today";
    if (activeTab === "week") {
      const days = differenceInDays(new Date(item.date), new Date());
      return days >= 0 && days <= 7;
    }
    return item.type === activeTab;
  });

  const overdueCount = deadlines.filter((d) => d.urgency === "overdue").length;
  const todayCount = deadlines.filter((d) => d.urgency === "today").length;
  const urgentCount = deadlines.filter((d) => d.urgency === "urgent").length;

  const handleItemClick = (item: DeadlineItem) => {
    switch (item.type) {
      case "project":
        navigate("/projetos");
        break;
      case "appointment":
        navigate("/agenda");
        break;
      case "goal":
        navigate("/metas");
        break;
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Prazos & Notificações
          </h1>
          <p className="text-muted-foreground">Acompanhe todos os seus prazos em um só lugar</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={overdueCount > 0 ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-8 w-8 ${overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                  <p className="text-sm text-muted-foreground">Atrasados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={todayCount > 0 ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className={`h-8 w-8 ${todayCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-2xl font-bold">{todayCount}</p>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={urgentCount > 0 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-8 w-8 ${urgentCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-2xl font-bold">{urgentCount}</p>
                  <p className="text-sm text-muted-foreground">Próx. 3 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{deadlines.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1">
              Atrasados
              {overdueCount > 0 && <Badge variant="destructive" className="text-xs">{overdueCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="urgent">Urgentes</TabsTrigger>
            <TabsTrigger value="week">Esta semana</TabsTrigger>
            <TabsTrigger value="project">Projetos</TabsTrigger>
            <TabsTrigger value="appointment">Compromissos</TabsTrigger>
            <TabsTrigger value="goal">Metas</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : filteredDeadlines.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Tudo em dia!</p>
                  <p className="text-muted-foreground">Nenhum prazo pendente nesta categoria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredDeadlines.map((item) => {
                  const urgencyConf = urgencyConfig[item.urgency];
                  const typeConf = typeConfig[item.type];
                  const TypeIcon = typeConf.icon;
                  const UrgencyIcon = urgencyConf.icon;

                  return (
                    <Card
                      key={`${item.type}-${item.id}`}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Urgency indicator */}
                          <div className={`p-2 rounded-lg ${urgencyConf.color}`}>
                            <UrgencyIcon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className={`h-4 w-4 ${typeConf.color}`} />
                              <span className="text-xs text-muted-foreground">{typeConf.label}</span>
                            </div>
                            <h3 className="font-medium truncate">{item.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(item.date), "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                              {item.time && (
                                <>
                                  <Clock className="h-3 w-3 ml-2" />
                                  <span>{item.time.slice(0, 5)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Progress for goals */}
                          {item.type === "goal" && item.progress !== undefined && (
                            <div className="text-right">
                              <p className="text-lg font-bold">{item.progress}%</p>
                              <p className="text-xs text-muted-foreground">concluído</p>
                            </div>
                          )}

                          {/* Badge */}
                          <Badge className={urgencyConf.color}>
                            {urgencyConf.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
