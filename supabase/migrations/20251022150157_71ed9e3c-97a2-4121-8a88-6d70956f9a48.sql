-- Update Haniska project to be active
UPDATE public.projects 
SET is_active = true, 
    status = 'active'
WHERE name = 'Haniska';