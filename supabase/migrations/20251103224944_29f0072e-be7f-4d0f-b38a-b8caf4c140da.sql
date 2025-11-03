-- Make vehicle-photos bucket public to allow photo display
-- This allows photos to be accessed via public URLs
-- RLS policies still control who can upload/delete photos
UPDATE storage.buckets 
SET public = true 
WHERE name = 'vehicle-photos';