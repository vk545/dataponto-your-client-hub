
-- Update SELECT policies to allow all authenticated users to see all data

-- Goals
DROP POLICY "goals_select" ON public.goals;
CREATE POLICY "goals_select" ON public.goals FOR SELECT TO authenticated USING (true);

-- Projects
DROP POLICY "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);

-- Clients
DROP POLICY "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (true);

-- Appointments
DROP POLICY "appointments_select" ON public.appointments;
CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated USING (true);

-- Shared files
DROP POLICY "shared_files_select" ON public.shared_files;
CREATE POLICY "shared_files_select" ON public.shared_files FOR SELECT TO authenticated USING (true);

-- Notes
DROP POLICY "notes_select" ON public.notes;
CREATE POLICY "notes_select" ON public.notes FOR SELECT TO authenticated USING (true);
