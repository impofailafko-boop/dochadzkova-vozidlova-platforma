-- Add GPS location columns for departure tracking
-- This allows tracking employee location when they clock out

ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS departure_latitude numeric,
ADD COLUMN IF NOT EXISTS departure_longitude numeric;

COMMENT ON COLUMN public.attendance.departure_latitude IS 'GPS latitude where employee clocked out';
COMMENT ON COLUMN public.attendance.departure_longitude IS 'GPS longitude where employee clocked out';