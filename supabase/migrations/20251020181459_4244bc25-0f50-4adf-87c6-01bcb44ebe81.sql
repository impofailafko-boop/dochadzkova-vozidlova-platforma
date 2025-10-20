-- Fix: Add NULL check to update_vehicle_current_km function
CREATE OR REPLACE FUNCTION public.update_vehicle_current_km()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if km_end is not NULL
  IF NEW.km_end IS NOT NULL THEN
    UPDATE public.vehicles
    SET current_km = NEW.km_end
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$;