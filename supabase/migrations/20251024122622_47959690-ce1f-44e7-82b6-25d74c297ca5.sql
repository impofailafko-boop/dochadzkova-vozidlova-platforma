-- Remove PIN code functionality from the platform
-- This removes the pin_code column from profiles table

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS pin_code;