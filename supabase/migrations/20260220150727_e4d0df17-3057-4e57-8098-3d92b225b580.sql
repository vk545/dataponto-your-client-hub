
-- Update DELETE and UPDATE policies to allow all authenticated users

-- Goals
DROP POLICY "goals_delete" ON public.goals;
CREATE POLICY "goals_delete" ON public.goals FOR DELETE TO authenticated USING (true);
DROP POLICY "goals_update" ON public.goals;
CREATE POLICY "goals_update" ON public.goals FOR UPDATE TO authenticated USING (true);

-- Projects
DROP POLICY "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);
DROP POLICY "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true);

-- Clients
DROP POLICY "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (true);
DROP POLICY "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (true);

-- Appointments
DROP POLICY "appointments_delete" ON public.appointments;
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated USING (true);
DROP POLICY "appointments_update" ON public.appointments;
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated USING (true);

-- Shared files
DROP POLICY "shared_files_delete" ON public.shared_files;
CREATE POLICY "shared_files_delete" ON public.shared_files FOR DELETE TO authenticated USING (true);
DROP POLICY "shared_files_update" ON public.shared_files;
CREATE POLICY "shared_files_update" ON public.shared_files FOR UPDATE TO authenticated USING (true);

-- Notes
DROP POLICY "notes_delete" ON public.notes;
CREATE POLICY "notes_delete" ON public.notes FOR DELETE TO authenticated USING (true);
DROP POLICY "notes_update" ON public.notes;
CREATE POLICY "notes_update" ON public.notes FOR UPDATE TO authenticated USING (true);
