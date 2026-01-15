import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Flag } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, differenceInDays, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProjectStatus = "idea" | "planning" | "executing" | "review" | "completed";
type PriorityLevel = "low" | "medium" | "high" | "urgent";

interface Project {
  id: string;
  name: string;
  description: string | null;
  responsible: string | null;
  priority: PriorityLevel;
  status: ProjectStatus;
  start_date: string;
  due_date: string | null;
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  idea: { label: "Ideia", color: "bg-purple-500", bgColor: "bg-purple-100" },
  planning: { label: "Planejamento", color: "bg-blue-500", bgColor: "bg-blue-100" },
  executing: { label: "Em Execução", color: "bg-yellow-500", bgColor: "bg-yellow-100" },
  review: { label: "Em Revisão", color: "bg-orange-500", bgColor: "bg-orange-100" },
  completed: { label: "Concluído", color: "bg-green-500", bgColor: "bg-green-100" },
};

const priorityConfig: Record<PriorityLevel, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-gray-500" },
  medium: { label: "Média", color: "text-blue-500" },
  high: { label: "Alta", color: "text-orange-500" },
  urgent: { label: "Urgente", color: "text-red-500" },
};

export default function Cronograma() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");

  const fetchProjects = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, responsible, priority, status, start_date, due_date")
      .order("start_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar projetos");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const uniqueResponsibles = [...new Set(projects.map(p => p.responsible).filter(Boolean))] as string[];

  const filteredProjects = projects.filter(project => {
    if (statusFilter !== "all" && project.status !== statusFilter) return false;
    if (responsibleFilter !== "all" && project.responsible !== responsibleFilter) return false;
    
    const projectStart = new Date(project.start_date);
    const projectEnd = project.due_date ? new Date(project.due_date) : projectStart;
    
    return isWithinInterval(monthStart, { start: projectStart, end: projectEnd }) ||
           isWithinInterval(monthEnd, { start: projectStart, end: projectEnd }) ||
           isWithinInterval(projectStart, { start: monthStart, end: monthEnd }) ||
           isWithinInterval(projectEnd, { start: monthStart, end: monthEnd });
  });

  const getProjectPosition = (project: Project) => {
    const projectStart = new Date(project.start_date);
    const projectEnd = project.due_date ? new Date(project.due_date) : projectStart;
    
    const displayStart = projectStart < monthStart ? monthStart : projectStart;
    const displayEnd = projectEnd > monthEnd ? monthEnd : projectEnd;
    
    const startDay = differenceInDays(displayStart, monthStart);
    const duration = differenceInDays(displayEnd, displayStart) + 1;
    
    const startPercent = (startDay / daysInMonth.length) * 100;
    const widthPercent = (duration / daysInMonth.length) * 100;
    
    return { left: `${startPercent}%`, width: `${Math.max(widthPercent, 3)}%` };
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Cronograma
            </h1>
            <p className="text-muted-foreground">Visualização em linha do tempo dos projetos</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueResponsibles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <Card>
            <CardContent className="p-4">
              {/* Days Header */}
              <div className="relative mb-4 overflow-x-auto">
                <div className="flex border-b pb-2 min-w-[800px]">
                  {daysInMonth.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="flex-1 text-center text-xs text-muted-foreground"
                    >
                      <div className="font-medium">{format(day, "dd")}</div>
                      <div className="text-[10px]">{format(day, "EEE", { locale: ptBR })}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3 overflow-x-auto">
                {filteredProjects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum projeto encontrado para este período
                  </p>
                ) : (
                  filteredProjects.map((project) => {
                    const position = getProjectPosition(project);
                    const config = statusConfig[project.status];
                    
                    return (
                      <div key={project.id} className="relative h-14 min-w-[800px]">
                        {/* Background grid */}
                        <div className="absolute inset-0 flex">
                          {daysInMonth.map((day, i) => (
                            <div
                              key={day.toISOString()}
                              className={`flex-1 border-l ${i === 0 ? "border-l-0" : ""} border-muted`}
                            />
                          ))}
                        </div>
                        
                        {/* Project bar */}
                        <div
                          className={`absolute top-1 h-12 rounded-lg ${config.color} text-white p-2 shadow-md cursor-pointer hover:opacity-90 transition-opacity overflow-hidden`}
                          style={position}
                          title={`${project.name}\n${format(new Date(project.start_date), "dd/MM")} - ${project.due_date ? format(new Date(project.due_date), "dd/MM") : "Sem prazo"}`}
                        >
                          <div className="flex items-center gap-2 h-full">
                            <span className="font-medium text-sm truncate">{project.name}</span>
                            {project.responsible && (
                              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                                {project.responsible}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                {Object.entries(statusConfig).map(([key, { label, color }]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${color}`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
