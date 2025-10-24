-- Remove unique constraint to allow multiple attendance records per day
-- This allows employees to clock in/out multiple times in a single day

ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_user_date_unique;

-- Also remove the old constraint if it exists from initial migration
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_user_id_date_key;