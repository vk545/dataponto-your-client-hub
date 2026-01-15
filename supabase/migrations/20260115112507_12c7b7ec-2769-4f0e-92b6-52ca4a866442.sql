-- Fix RLS policies for clients table - restrict to owner only
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = created_by);

-- Fix RLS policies for goals table - restrict to owner only
DROP POLICY IF EXISTS "Authenticated users can view all goals" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can update goals" ON public.goals;
DROP POLICY IF EXISTS "Authenticated users can delete goals" ON public.goals;

CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = created_by);