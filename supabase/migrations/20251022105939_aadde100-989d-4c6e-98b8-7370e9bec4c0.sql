-- Add GPS location columns to vehicle_logs table for tracking start and end location
ALTER TABLE public.vehicle_logs
ADD COLUMN start_latitude numeric,
ADD COLUMN start_longitude numeric,
ADD COLUMN end_latitude numeric,
ADD COLUMN end_longitude numeric;

COMMENT ON COLUMN public.vehicle_logs.start_latitude IS 'GPS latitude where drive started';
COMMENT ON COLUMN public.vehicle_logs.start_longitude IS 'GPS longitude where drive started';
COMMENT ON COLUMN public.vehicle_logs.end_latitude IS 'GPS latitude where drive ended';
COMMENT ON COLUMN public.vehicle_logs.end_longitude IS 'GPS longitude where drive ended';