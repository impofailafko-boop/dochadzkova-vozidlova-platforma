-- Create enum for job positions
CREATE TYPE public.job_position AS ENUM (
  'pilcik',
  'strojnik',
  'elektrikar',
  'sofer',
  'administrativa'
);

-- Add job_position column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN job_position public.job_position DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.job_position IS 'Employee job position in the company';