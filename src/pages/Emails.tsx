import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientDialog } from "@/components/dialogs/ClientDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";
import { 
  Plus, 
  Search, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreVertical,
  Calendar,
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
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type EmailStatus = "accepted" | "rejected" | "pending";

interface Client {
  id: string;
  name: string;
  email: string;
  entry_date: string;
  email_status: EmailStatus;
  last_contact: string | null;
  next_reminder: string | null;
  reminder_days: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function Emails() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (client: Omit<Client, "id" | "created_by" | "created_at" | "updated_at" | "entry_date" | "last_contact" | "next_reminder">) => {
      const today = new Date();
      const nextReminder = addDays(today, client.reminder_days);
      
      const { error } = await supabase.from("clients").insert({
        ...client,
        created_by: user!.id,
        entry_date: format(today, "yyyy-MM-dd"),
        last_contact: format(today, "yyyy-MM-dd"),
        next_reminder: format(nextReminder, "yyyy-MM-dd"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const updates: any = { ...client };
      if (client.reminder_days) {
        const today = new Date();
        updates.next_reminder = format(addDays(today, client.reminder_days), "yyyy-MM-dd");
      }
      
      const { error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      setSelectedClient(null);
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar cliente", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteDialogOpen(false);
      setSelectedClient(null);
      toast({ title: "Cliente removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover cliente", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = async (clientData: any) => {
    if (selectedClient) {
      await updateMutation.mutateAsync({ id: selectedClient.id, ...clientData });
    } else {
      await createMutation.mutateAsync(clientData);
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    const configs = {
      accepted: {
        icon: CheckCircle,
        label: "Aceito",
        className: "bg-success/10 text-success border-success/20",
      },
      rejected: {
        icon: XCircle,
        label: "Recusado",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      },
      pending: {
        icon: Clock,
        label: "Pendente",
        className: "bg-warning/10 text-warning border-warning/20",
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clients.length,
    accepted: clients.filter((c) => c.email_status === "accepted").length,
    pending: clients.filter((c) => c.email_status === "pending").length,
    rejected: clients.filter((c) => c.email_status === "rejected").length,
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
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
              E-mails
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e lembretes de e-mail
            </p>
          </div>
          <Button 
            className="gradient-brand hover:opacity-90 transition-opacity"
            onClick={() => {
              setSelectedClient(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-display font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-success/5 border-success/20">
            <p className="text-sm text-success">Aceitos</p>
            <p className="text-2xl font-display font-bold text-success">{stats.accepted}</p>
          </Card>
          <Card className="p-4 bg-warning/5 border-warning/20">
            <p className="text-sm text-warning">Pendentes</p>
            <p className="text-2xl font-display font-bold text-warning">{stats.pending}</p>
          </Card>
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <p className="text-sm text-destructive">Recusados</p>
            <p className="text-2xl font-display font-bold text-destructive">{stats.rejected}</p>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center text-white font-semibold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Entrada: {formatDate(client.entry_date)}</span>
                          {client.next_reminder && (
                            <>
                              <span className="mx-1">•</span>
                              <Clock className="h-3 w-3 text-warning" />
                              <span className="text-warning">
                                Lembrete: {formatDate(client.next_reminder)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(client.email_status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClient(client);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedClient(client);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <ClientDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          client={selectedClient}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        />

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => deleteMutation.mutateAsync(selectedClient!.id)}
          title="Remover Cliente"
          description={`Tem certeza que deseja remover ${selectedClient?.name}? Esta ação não pode ser desfeita.`}
          loading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
