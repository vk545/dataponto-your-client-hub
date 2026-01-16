import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Emails from "./pages/Emails";
import Metas from "./pages/Metas";
import Chat from "./pages/Chat";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Notas from "./pages/Notas";
import Projetos from "./pages/Projetos";
import Cronograma from "./pages/Cronograma";
import Agenda from "./pages/Agenda";
import Arquivos from "./pages/Arquivos";
import Prazos from "./pages/Prazos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/emails" element={<Emails />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/cronograma" element={<Cronograma />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/arquivos" element={<Arquivos />} />
          <Route path="/prazos" element={<Prazos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
