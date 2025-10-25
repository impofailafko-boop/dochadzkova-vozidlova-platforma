-- Add service-related fields to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN service_date TEXT,
ADD COLUMN stk_date TEXT,
ADD COLUMN insurance_date TEXT,
ADD COLUMN emission_date TEXT;