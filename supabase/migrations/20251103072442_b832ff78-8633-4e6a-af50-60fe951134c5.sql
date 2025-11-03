-- Create new enum with updated values
CREATE TYPE public.employment_type_new AS ENUM (
  'zivnost',
  'dohoda_25',
  'dohoda_50',
  'tpp',
  'administrativa'
);

-- Add new column with new enum type
ALTER TABLE public.profiles 
ADD COLUMN employment_type_new employment_type_new;

-- Migrate existing data
-- Keep 'zivnost' as 'zivnost'
UPDATE public.profiles 
SET employment_type_new = 'zivnost'
WHERE employment_type = 'zivnost';

-- Set 'dohoda' to NULL for admin to reassign
UPDATE public.profiles 
SET employment_type_new = NULL
WHERE employment_type = 'dohoda';

-- Drop old column
ALTER TABLE public.profiles 
DROP COLUMN employment_type;

-- Rename new column to original name
ALTER TABLE public.profiles 
RENAME COLUMN employment_type_new TO employment_type;

-- Set default to NULL
ALTER TABLE public.profiles 
ALTER COLUMN employment_type SET DEFAULT NULL;

-- Update handle_new_user function to set employment_type to NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, employment_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULL  -- Set to NULL so it shows as "Nezaznamenané" in UI
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$function$;