-- Add project_id column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_attendance_project_id ON public.attendance(project_id);

-- Add comment for documentation
COMMENT ON COLUMN public.attendance.project_id IS 'Project the employee is working on during this attendance period';