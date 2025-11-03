-- Add last_used_vehicle_id column to profiles table
-- This will store the last vehicle used by each employee
ALTER TABLE public.profiles 
ADD COLUMN last_used_vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.last_used_vehicle_id IS 'Stores the ID of the last vehicle used by this user to show it first in vehicle selection';

-- Create index for better performance when querying by last_used_vehicle_id
CREATE INDEX idx_profiles_last_used_vehicle ON public.profiles(last_used_vehicle_id);