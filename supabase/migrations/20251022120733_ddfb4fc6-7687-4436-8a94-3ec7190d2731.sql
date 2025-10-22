-- Add pin_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN pin_code TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.pin_code IS '4-digit PIN code for quick app unlock';
