import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface UseNotificationsProps {
  userId: string | undefined;
  enabled: boolean;
}

async function registerPushSubscription(userId: string) {
  try {
    const registration = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const reg = registration as any;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
      });
    }

    if (!subscription) return;

    const subscriptionJson = subscription.toJSON();
    const endpoint = subscriptionJson.endpoint || '';
    const p256dh = subscriptionJson.keys?.p256dh || '';
    const auth = subscriptionJson.keys?.auth || '';

    // Save to database (upsert by user_id + endpoint)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh,
          auth,
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      console.error('Failed to save push subscription:', error);
    } else {
      console.log('Push subscription registered successfully');
    }
  } catch (err) {
    console.log('Push subscription not available:', err);
  }
}

async function sendPushToOthers(title: string, body: string, senderId: string, type: string) {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(`https://${projectId}.supabase.co/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ title, body, sender_id: senderId, type }),
    });
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
}

export function useNotifications({ userId, enabled }: UseNotificationsProps) {
  const { toast } = useToast();
  const location = useLocation();
  const notifiedAppointments = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Register push subscription on mount
  useEffect(() => {
    if (!enabled || !userId) return;
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Request notification permission first
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            registerPushSubscription(userId);
          }
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        registerPushSubscription(userId);
      }
    }
  }, [enabled, userId]);

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

        // Also send push to all users
        sendPushToOthers(
          "📅 Compromisso chegando!",
          `"${apt.title}" começa ${timeText}`,
          "", // empty so everyone gets it
          "appointment"
        );
      }
    }
  }, [userId, toast]);

  // Check appointments every minute
  useEffect(() => {
    if (!enabled || !userId) return;

    checkAppointmentReminders();
    intervalRef.current = setInterval(checkAppointmentReminders, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, userId, checkAppointmentReminders]);

  // Listen for new chat messages
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

          // In-app toast (only if not on chat page)
          if (location.pathname !== "/chat") {
            toast({
              title: `💬 Nova mensagem de ${senderName}`,
              description: preview,
              duration: 8000,
            });
          }

          // Send push notification (works even when app is closed)
          sendPushToOthers(
            `💬 Nova mensagem de ${senderName}`,
            preview,
            message.sender_id,
            "message"
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, userId, location.pathname, toast]);
}
