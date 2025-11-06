-- Fix RLS policy for projects table to require authentication
DROP POLICY IF EXISTS "Authenticated employees can view active projects" ON public.projects;

CREATE POLICY "Authenticated employees can view active projects"
ON public.projects
FOR SELECT
TO authenticated
USING ((auth.uid() IS NOT NULL) AND (status = 'active'::project_status));

-- Add RLS policies for vehicle-photos storage bucket
-- Note: RLS is already enabled on storage.objects by Supabase

-- Users can upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own photos
CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all photos
CREATE POLICY "Admins can view all photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vehicle-photos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can delete all photos
CREATE POLICY "Admins can delete all photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-photos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);