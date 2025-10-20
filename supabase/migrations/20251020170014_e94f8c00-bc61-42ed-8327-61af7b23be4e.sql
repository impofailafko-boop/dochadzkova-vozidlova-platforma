-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-photos', 'vehicle-photos', false);

-- Add RLS policies for vehicle photos
CREATE POLICY "Users can upload their own vehicle photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own vehicle photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all vehicle photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vehicle-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Modify vehicle_logs table
ALTER TABLE public.vehicle_logs
ADD COLUMN photo_km_start TEXT,
ADD COLUMN photo_km_end TEXT,
ADD COLUMN is_completed BOOLEAN DEFAULT false;

-- Make km_end nullable for in-progress drives
ALTER TABLE public.vehicle_logs
ALTER COLUMN km_end DROP NOT NULL;

-- Update existing records to be completed
UPDATE public.vehicle_logs
SET is_completed = true
WHERE km_end IS NOT NULL;