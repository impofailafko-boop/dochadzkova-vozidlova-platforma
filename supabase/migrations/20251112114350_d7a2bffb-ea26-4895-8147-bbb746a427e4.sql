-- Add completed_at timestamp column to vehicle_logs
ALTER TABLE public.vehicle_logs 
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment explaining the column
COMMENT ON COLUMN public.vehicle_logs.completed_at IS 'Timestamp when the drive was completed (km_end was recorded)';

-- Create trigger to automatically set completed_at when is_completed becomes true
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If is_completed changes from false to true, set completed_at to now
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    NEW.completed_at = now();
  END IF;
  
  -- If is_completed changes from true to false, clear completed_at
  IF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_completed_at
BEFORE UPDATE ON public.vehicle_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_completed_at();