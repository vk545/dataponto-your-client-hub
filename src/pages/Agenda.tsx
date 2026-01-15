import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, MapPin, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentDialog } from "@/components/dialogs/AppointmentDialog";
import { DeleteDialog } from "@/components/dialogs/DeleteDialog";

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  reminder_minutes: number | null;
  location: string | null;
  notes: string | null;
}

export default function Agenda() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar compromissos");
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start from Sunday
  const startDayOfWeek = monthStart.getDay();
  const paddedDays = Array(startDayOfWeek).fill(null).concat(daysInMonth);

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(a => isSameDay(new Date(a.appointment_date), date));
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleDelete = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAppointment) return;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", selectedAppointment.id);

    if (error) {
      toast.error("Erro ao excluir compromisso");
    } else {
      setAppointments(appointments.filter((a) => a.id !== selectedAppointment.id));
      toast.success("Compromisso excluído");
    }
    setDeleteDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Agenda
            </h1>
            <p className="text-muted-foreground">Gerencie seus compromissos e reuniões</p>
          </div>
          <Button onClick={handleNewAppointment} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Compromisso
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </CardTitle>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {paddedDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }
                    
                    const dayAppointments = getAppointmentsForDate(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isPast = isBefore(day, new Date()) && !isToday(day);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square p-1 rounded-lg transition-all relative ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : isToday(day)
                            ? "bg-primary/20 text-primary"
                            : isPast
                            ? "text-muted-foreground/50"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="text-sm">{format(day, "d")}</span>
                        {dayAppointments.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayAppointments.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-primary-foreground" : "bg-primary"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected date appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDateAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum compromisso
                  </p>
                ) : (
                  selectedDateAppointments.map((appointment) => (
                    <Card
                      key={appointment.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleEdit(appointment)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="font-medium">{appointment.title}</div>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {appointment.start_time.slice(0, 5)}
                              {appointment.end_time && ` - ${appointment.end_time.slice(0, 5)}`}
                            </span>
                          </div>
                          
                          {appointment.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{appointment.location}</span>
                            </div>
                          )}
                          
                          {appointment.reminder_minutes && (
                            <div className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              <span>{appointment.reminder_minutes}min</span>
                            </div>
                          )}
                        </div>
                        
                        {appointment.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {appointment.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleNewAppointment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <AppointmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          appointment={selectedAppointment}
          defaultDate={selectedDate}
          onSuccess={() => {
            fetchAppointments();
            setDialogOpen(false);
          }}
          onDelete={selectedAppointment ? () => handleDelete(selectedAppointment) : undefined}
        />

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Excluir Compromisso"
          description={`Tem certeza que deseja excluir "${selectedAppointment?.title}"? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
        />
      </div>
    </AppLayout>
  );
}
