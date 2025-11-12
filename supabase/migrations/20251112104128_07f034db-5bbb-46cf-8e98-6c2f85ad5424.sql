-- Add hourly_rate column to profiles table
ALTER TABLE public.profiles ADD COLUMN hourly_rate numeric(10,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.hourly_rate IS 'Hodinová sadzba zamestnanca v eurách';

-- Add check constraint to ensure valid range
ALTER TABLE public.profiles ADD CONSTRAINT hourly_rate_valid_range 
  CHECK (hourly_rate IS NULL OR (hourly_rate >= 0 AND hourly_rate <= 999.99));