-- Fix #1: Prevent multiple check-ins per day
-- Add unique constraint on user_id + date combination
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_user_date_unique UNIQUE (user_id, date);

-- Fix #4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_user_id ON public.vehicle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_vehicle_id ON public.vehicle_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_date ON public.vehicle_logs(date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_user_id ON public.fuel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON public.fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(date);

-- Fix #5: Automatic current_km update via trigger
-- Create function to update vehicle's current_km when a new vehicle log is added
CREATE OR REPLACE FUNCTION public.update_vehicle_current_km()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the vehicle's current_km with the km_end from the new log
  UPDATE public.vehicles
  SET current_km = NEW.km_end
  WHERE id = NEW.vehicle_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after insert or update on vehicle_logs
CREATE TRIGGER trigger_update_vehicle_km
AFTER INSERT OR UPDATE OF km_end ON public.vehicle_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_vehicle_current_km();

-- Fix: Employee deletion - Add DELETE policy on profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));