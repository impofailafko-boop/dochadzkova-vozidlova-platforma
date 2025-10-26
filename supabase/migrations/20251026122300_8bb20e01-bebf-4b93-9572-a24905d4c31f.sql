-- Add note columns for vehicle service records
ALTER TABLE vehicles 
ADD COLUMN service_note text,
ADD COLUMN stk_note text,
ADD COLUMN insurance_note text,
ADD COLUMN emission_note text;