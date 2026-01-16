import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
}

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(["messages"], (old = []) => {
            const exists = old.some((m) => m.id === payload.new.id);
            if (exists) return old;
            return [...old, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        content,
        sender_id: user!.id,
      });
      if (error) throw error;
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = newMessage;
    setNewMessage("");
    await sendMutation.mutateAsync(message);
  };

  const getProfile = (userId: string) => {
    return profiles.find((p) => p.user_id === userId);
  };

  const getDisplayName = (userId: string) => {
    const profile = getProfile(userId);
    return profile?.display_name || "Usuário";
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  const getOtherUser = () => {
    const otherProfile = profiles.find((p) => p.user_id !== user?.id);
    return otherProfile?.display_name || "Colega";
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-2rem)] p-8 flex flex-col">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="flex-1" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-2rem)] p-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            Converse em tempo real com sua colega
          </p>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-brand flex items-center justify-center text-white font-semibold">
              {getOtherUser().charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{getOtherUser()}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success"></span>
                Chat ativo
              </p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-3/4" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-4" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm">Comece uma conversa!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMe = message.sender_id === user?.id;
                  const profile = getProfile(message.sender_id);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 animate-scale-in ${
                          isMe
                            ? "gradient-brand text-white rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {getDisplayName(message.sender_id)}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={sendMutation.isPending}
              />
              <Button
                type="submit"
                size="icon"
                className="gradient-brand hover:opacity-90 transition-opacity"
                disabled={!newMessage.trim() || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
