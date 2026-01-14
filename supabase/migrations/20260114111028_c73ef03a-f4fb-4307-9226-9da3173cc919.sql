-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela de clientes (gestão de e-mails)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('accepted', 'rejected', 'pending')),
  last_contact DATE,
  next_reminder DATE,
  reminder_days INTEGER DEFAULT 7,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Ambas usuárias podem ver todos os clientes
CREATE POLICY "Authenticated users can view all clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete clients" ON public.clients
  FOR DELETE TO authenticated USING (true);

-- Tabela de metas
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'finishing', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all goals" ON public.goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create goals" ON public.goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update goals" ON public.goals
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete goals" ON public.goals
  FOR DELETE TO authenticated USING (true);

-- Tabela de mensagens do chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all messages" ON public.messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Habilitar realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();