-- Ensure vehicle-photos storage bucket exists
-- This is idempotent - safe to run multiple times
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-photos', 
  'vehicle-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Recreate RLS policies for vehicle-photos (drop if exists first)
DROP POLICY IF EXISTS "Users can upload their own vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all vehicle photos" ON storage.objects;

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload their own vehicle photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own photos
CREATE POLICY "Users can view their own vehicle photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all photos
CREATE POLICY "Admins can view all vehicle photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vehicle-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);