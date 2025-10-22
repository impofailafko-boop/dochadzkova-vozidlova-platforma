-- Synchronize data: set status='active' for all projects with is_active=true and status='planned'
UPDATE public.projects 
SET status = 'active'
WHERE is_active = true AND status = 'planned';

-- Remove is_active column
ALTER TABLE public.projects 
DROP COLUMN is_active;

-- Update RLS policy for employees to only check status
DROP POLICY IF EXISTS "Authenticated employees can view active projects" ON public.projects;

CREATE POLICY "Authenticated employees can view active projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (status = 'active'::project_status);