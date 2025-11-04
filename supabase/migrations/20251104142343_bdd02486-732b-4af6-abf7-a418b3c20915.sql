-- Add UPDATE and DELETE RLS policies for vehicle-photos storage bucket
-- This allows users to update/delete their own photos and admins to manage all photos

-- Allow users to update their own vehicle photos
CREATE POLICY "Users can update their own vehicle photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own vehicle photos
CREATE POLICY "Users can delete their own vehicle photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vehicle-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to update all vehicle photos
CREATE POLICY "Admins can update all vehicle photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vehicle-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete all vehicle photos
CREATE POLICY "Admins can delete all vehicle photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vehicle-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);