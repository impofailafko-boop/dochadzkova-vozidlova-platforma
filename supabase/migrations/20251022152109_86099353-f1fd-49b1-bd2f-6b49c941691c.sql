-- Set Haniska project to active status
UPDATE public.projects 
SET status = 'active'
WHERE name = 'Haniska';