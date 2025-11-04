-- Update vehicle-photos bucket file size limit to 10MB
UPDATE storage.buckets 
SET file_size_limit = 10485760
WHERE id = 'vehicle-photos';