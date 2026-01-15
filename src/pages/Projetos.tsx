import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, User, Flag, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProjectDialog } from "@/components/dialogs/ProjectDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";

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
  observations: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: "Ideia", color: "bg-purple-500/20 text-purple-700 border-purple-300" },
  planning: { label: "Planejamento", color: "bg-blue-500/20 text-blue-700 border-blue-300" },
  executing: { label: "Em Execução", color: "bg-yellow-500/20 text-yellow-700 border-yellow-300" },
  review: { label: "Em Revisão", color: "bg-orange-500/20 text-orange-700 border-orange-300" },
  completed: { label: "Concluído", color: "bg-green-500/20 text-green-700 border-green-300" },
};

const priorityConfig: Record<PriorityLevel, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-gray-500" },
  medium: { label: "Média", color: "text-blue-500" },
  high: { label: "Alta", color: "text-orange-500" },
  urgent: { label: "Urgente", color: "text-red-500" },
};

const statusOrder: ProjectStatus[] = ["idea", "planning", "executing", "review", "completed"];

export default function Projetos() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

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

  const handleDragStart = (project: Project) => {
    setDraggedProject(project);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: ProjectStatus) => {
    if (!draggedProject || draggedProject.status === status) {
      setDraggedProject(null);
      return;
    }

    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", draggedProject.id);

    if (error) {
      toast.error("Erro ao mover projeto");
    } else {
      setProjects(
        projects.map((p) =>
          p.id === draggedProject.id ? { ...p, status } : p
        )
      );
      toast.success(`Projeto movido para ${statusConfig[status].label}`);
    }
    setDraggedProject(null);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", selectedProject.id);

    if (error) {
      toast.error("Erro ao excluir projeto");
    } else {
      setProjects(projects.filter((p) => p.id !== selectedProject.id));
      toast.success("Projeto excluído");
    }
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const getDeadlineBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    if (days === 0) return <Badge className="bg-red-500 text-xs">Hoje</Badge>;
    if (days <= 3) return <Badge className="bg-orange-500 text-xs">{days}d</Badge>;
    if (days <= 7) return <Badge className="bg-yellow-500 text-xs">{days}d</Badge>;
    return null;
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Projetos
            </h1>
            <p className="text-muted-foreground">Gerencie seus projetos em formato Kanban</p>
          </div>
          <Button onClick={() => { setSelectedProject(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {statusOrder.map((status) => (
              <div
                key={status}
                className="min-w-[280px] space-y-3"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
              >
                <div className={`p-3 rounded-lg border ${statusConfig[status].color}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{statusConfig[status].label}</span>
                    <Badge variant="outline" className="text-xs">
                      {projects.filter((p) => p.status === status).length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {projects
                    .filter((p) => p.status === status)
                    .map((project) => (
                      <Card
                        key={project.id}
                        draggable
                        onDragStart={() => handleDragStart(project)}
                        className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                          draggedProject?.id === project.id ? "opacity-50" : ""
                        }`}
                        onClick={() => handleEdit(project)}
                      >
                        <CardHeader className="p-3 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {project.name}
                            </CardTitle>
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 text-xs">
                            {project.responsible && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{project.responsible}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 ${priorityConfig[project.priority].color}`}>
                              <Flag className="h-3 w-3" />
                              <span>{priorityConfig[project.priority].label}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {project.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(new Date(project.due_date), "dd/MM", { locale: ptBR })}
                                </span>
                              </div>
                            )}
                            {getDeadlineBadge(project.due_date)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <ProjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          project={selectedProject}
          onSuccess={() => {
            fetchProjects();
            setDialogOpen(false);
          }}
          onDelete={selectedProject ? () => handleDelete(selectedProject) : undefined}
        />

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Excluir Projeto"
          description={`Tem certeza que deseja excluir o projeto "${selectedProject?.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
        />
      </div>
    </AppLayout>
  );
}
