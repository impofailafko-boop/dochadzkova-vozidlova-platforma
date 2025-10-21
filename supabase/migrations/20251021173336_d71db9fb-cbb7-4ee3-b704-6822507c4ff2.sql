-- Add photo_receipt column to fuel_logs table
ALTER TABLE public.fuel_logs 
ADD COLUMN photo_receipt text;

COMMENT ON COLUMN public.fuel_logs.photo_receipt IS 'Path to receipt photo in storage bucket';
