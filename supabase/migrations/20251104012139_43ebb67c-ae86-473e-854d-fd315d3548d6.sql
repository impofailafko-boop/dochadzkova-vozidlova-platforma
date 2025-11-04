-- Add date tracking for daily project selection
ALTER TABLE public.profiles 
ADD COLUMN project_selected_date date;

COMMENT ON COLUMN public.profiles.project_selected_date IS 'Date when current_project_id was last selected (for daily project tracking)';
