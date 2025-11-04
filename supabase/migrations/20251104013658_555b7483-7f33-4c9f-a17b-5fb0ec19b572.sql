-- Fix storage bucket: Make vehicle-photos private instead of public
-- This prevents unauthorized access to vehicle photos via direct URLs
UPDATE storage.buckets 
SET public = false 
WHERE id = 'vehicle-photos';