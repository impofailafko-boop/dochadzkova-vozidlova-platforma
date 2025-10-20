-- Add project_id to fuel_logs table
ALTER TABLE public.fuel_logs
ADD COLUMN project_id uuid REFERENCES public.projects(id);

-- Create index for better query performance
CREATE INDEX idx_fuel_logs_project_id ON public.fuel_logs(project_id);