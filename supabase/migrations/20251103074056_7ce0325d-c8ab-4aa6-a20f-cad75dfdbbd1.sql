-- Add VIN and highway sticker expiry to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN vin text,
ADD COLUMN highway_sticker_expiry text;

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.vin IS 'Vehicle Identification Number';
COMMENT ON COLUMN public.vehicles.highway_sticker_expiry IS 'Highway sticker expiration date';