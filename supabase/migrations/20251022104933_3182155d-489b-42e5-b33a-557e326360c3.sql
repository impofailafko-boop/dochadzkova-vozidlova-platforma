-- Add GPS location columns to attendance table for tracking employee location on arrival
ALTER TABLE public.attendance
ADD COLUMN arrival_latitude numeric,
ADD COLUMN arrival_longitude numeric;

COMMENT ON COLUMN public.attendance.arrival_latitude IS 'GPS latitude where employee clocked in';
COMMENT ON COLUMN public.attendance.arrival_longitude IS 'GPS longitude where employee clocked in';