import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: "me" | "other";
  timestamp: string;
  senderName: string;
}

export default function Chat() {
  const [newMessage, setNewMessage] = useState("");

  // Dados mockados
  const messages: Message[] = [
    {
      id: "1",
      content: "Oi! Você viu os e-mails pendentes de hoje?",
      sender: "other",
      timestamp: "09:30",
      senderName: "Colega",
    },
    {
      id: "2",
      content: "Vi sim! Já mandei para o João e a Maria. Falta o Pedro ainda.",
      sender: "me",
      timestamp: "09:32",
      senderName: "Eu",
    },
    {
      id: "3",
      content: "Ótimo! E sobre a meta do redesign, como está o progresso?",
      sender: "other",
      timestamp: "09:35",
      senderName: "Colega",
    },
    {
      id: "4",
      content: "Estamos em 85%, deve finalizar até amanhã! 🎉",
      sender: "me",
      timestamp: "09:36",
      senderName: "Eu",
    },
    {
      id: "5",
      content: "Perfeito! Lembra de atualizar o status depois.",
      sender: "other",
      timestamp: "09:38",
      senderName: "Colega",
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // Aqui virá a lógica de envio
    setNewMessage("");
  };

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
              C
            </div>
            <div>
              <p className="font-medium">Colega</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success"></span>
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 animate-scale-in ${
                      message.sender === "me"
                        ? "gradient-brand text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "me" ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
                <Smile className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="gradient-brand hover:opacity-90 transition-opacity"
                disabled={!newMessage.trim()}
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
