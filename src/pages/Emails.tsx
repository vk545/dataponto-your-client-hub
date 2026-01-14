import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreVertical,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  dataEntrada: string;
  statusEmail: "aceito" | "recusado" | "pendente";
  ultimoContato?: string;
  proximoLembrete?: string;
}

export default function Emails() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dados mockados
  const clientes: Cliente[] = [
    {
      id: "1",
      nome: "João Silva",
      email: "joao.silva@email.com",
      dataEntrada: "10/01/2026",
      statusEmail: "aceito",
      ultimoContato: "12/01/2026",
      proximoLembrete: "19/01/2026",
    },
    {
      id: "2",
      nome: "Maria Santos",
      email: "maria.santos@email.com",
      dataEntrada: "08/01/2026",
      statusEmail: "pendente",
      ultimoContato: "08/01/2026",
    },
    {
      id: "3",
      nome: "Pedro Costa",
      email: "pedro.costa@email.com",
      dataEntrada: "05/01/2026",
      statusEmail: "recusado",
      ultimoContato: "07/01/2026",
    },
    {
      id: "4",
      nome: "Ana Oliveira",
      email: "ana.oliveira@email.com",
      dataEntrada: "03/01/2026",
      statusEmail: "aceito",
      ultimoContato: "10/01/2026",
      proximoLembrete: "17/01/2026",
    },
  ];

  const getStatusBadge = (status: Cliente["statusEmail"]) => {
    const configs = {
      aceito: {
        icon: CheckCircle,
        label: "Aceito",
        className: "bg-success/10 text-success border-success/20",
      },
      recusado: {
        icon: XCircle,
        label: "Recusado",
        className: "bg-destructive/10 text-destructive border-destructive/20",
      },
      pendente: {
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

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: clientes.length,
    aceitos: clientes.filter((c) => c.statusEmail === "aceito").length,
    pendentes: clientes.filter((c) => c.statusEmail === "pendente").length,
    recusados: clientes.filter((c) => c.statusEmail === "recusado").length,
  };

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
          <Button className="gradient-brand hover:opacity-90 transition-opacity">
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
            <p className="text-2xl font-display font-bold text-success">{stats.aceitos}</p>
          </Card>
          <Card className="p-4 bg-warning/5 border-warning/20">
            <p className="text-sm text-warning">Pendentes</p>
            <p className="text-2xl font-display font-bold text-warning">{stats.pendentes}</p>
          </Card>
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <p className="text-sm text-destructive">Recusados</p>
            <p className="text-2xl font-display font-bold text-destructive">{stats.recusados}</p>
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
            <div className="space-y-3">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full gradient-brand flex items-center justify-center text-white font-semibold">
                      {cliente.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{cliente.nome}</p>
                      <p className="text-sm text-muted-foreground">{cliente.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Entrada: {cliente.dataEntrada}</span>
                        {cliente.proximoLembrete && (
                          <>
                            <span className="mx-1">•</span>
                            <Clock className="h-3 w-3 text-warning" />
                            <span className="text-warning">Lembrete: {cliente.proximoLembrete}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(cliente.statusEmail)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar E-mail
                        </DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Definir Lembrete</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
