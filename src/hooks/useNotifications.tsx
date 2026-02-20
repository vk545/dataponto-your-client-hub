import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface UseNotificationsProps {
  userId: string | undefined;
  enabled: boolean;
}

export function useNotifications({ userId, enabled }: UseNotificationsProps) {
  const { toast } = useToast();
  const location = useLocation();
  const notifiedAppointments = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for upcoming appointments
  const checkAppointmentReminders = useCallback(async () => {
    if (!userId) return;

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, title, appointment_date, start_time, reminder_minutes")
      .eq("appointment_date", today)
      .not("reminder_minutes", "is", null)
      .gte("start_time", currentTime);

    if (!appointments) return;

    for (const apt of appointments) {
      if (notifiedAppointments.current.has(apt.id)) continue;

      const [hours, minutes] = apt.start_time.split(":").map(Number);
      const aptTime = new Date(now);
      aptTime.setHours(hours, minutes, 0, 0);

      const diffMs = aptTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const reminderMinutes = apt.reminder_minutes || 30;

      if (diffMinutes <= reminderMinutes && diffMinutes >= 0) {
        notifiedAppointments.current.add(apt.id);
        
        const timeText = diffMinutes === 0 
          ? "agora!" 
          : diffMinutes === 1 
          ? "em 1 minuto!" 
          : `em ${diffMinutes} minutos!`;

        toast({
          title: "📅 Compromisso chegando!",
          description: `"${apt.title}" começa ${timeText}`,
          duration: 10000,
        });

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("📅 Compromisso chegando!", {
            body: `"${apt.title}" começa ${timeText}`,
            icon: "/pwa-icon-192.png",
          });
        }
      }
    }
  }, [userId, toast]);

  // Request browser notification permission
  useEffect(() => {
    if (!enabled) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [enabled]);

  // Check appointments every minute
  useEffect(() => {
    if (!enabled || !userId) return;

    checkAppointmentReminders();
    intervalRef.current = setInterval(checkAppointmentReminders, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, userId, checkAppointmentReminders]);

  // Listen for new chat messages (only when NOT on /chat page)
  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase
      .channel("notifications-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new as { sender_id: string; content: string };

          // Don't notify for own messages
          if (message.sender_id === userId) return;

          // Don't notify if already on chat page
          if (location.pathname === "/chat") return;

          // Get sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", message.sender_id)
            .single();

          const senderName = profile?.display_name || "Alguém";
          const preview = message.content.length > 50 
            ? message.content.slice(0, 50) + "..." 
            : message.content;

          toast({
            title: `💬 Nova mensagem de ${senderName}`,
            description: preview,
            duration: 8000,
          });

          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`💬 Nova mensagem de ${senderName}`, {
              body: preview,
              icon: "/pwa-icon-192.png",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, userId, location.pathname, toast]);
}
