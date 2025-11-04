-- Add CHECK constraints for numeric fields to prevent invalid data

-- Vehicles table: kilometers must be non-negative
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_current_km_check 
CHECK (current_km >= 0);

-- Vehicle logs: kilometers must be positive and logical
ALTER TABLE public.vehicle_logs
ADD CONSTRAINT vehicle_logs_km_start_check 
CHECK (km_start > 0),
ADD CONSTRAINT vehicle_logs_km_end_check 
CHECK (km_end IS NULL OR km_end > 0),
ADD CONSTRAINT vehicle_logs_km_driven_check 
CHECK (km_driven IS NULL OR km_driven >= 0),
ADD CONSTRAINT vehicle_logs_km_logical_check
CHECK (km_end IS NULL OR km_end >= km_start);

-- Fuel logs: liters and price must be positive and within reasonable limits
ALTER TABLE public.fuel_logs
ADD CONSTRAINT fuel_logs_liters_check 
CHECK (liters > 0 AND liters <= 1000),
ADD CONSTRAINT fuel_logs_price_check 
CHECK (price IS NULL OR (price >= 0 AND price <= 20000));

-- Attendance: GPS coordinates must be within valid ranges
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_arrival_lat_check 
CHECK (arrival_latitude IS NULL OR (arrival_latitude >= -90 AND arrival_latitude <= 90)),
ADD CONSTRAINT attendance_arrival_lon_check 
CHECK (arrival_longitude IS NULL OR (arrival_longitude >= -180 AND arrival_longitude <= 180)),
ADD CONSTRAINT attendance_departure_lat_check 
CHECK (departure_latitude IS NULL OR (departure_latitude >= -90 AND departure_latitude <= 90)),
ADD CONSTRAINT attendance_departure_lon_check 
CHECK (departure_longitude IS NULL OR (departure_longitude >= -180 AND departure_longitude <= 180)),
ADD CONSTRAINT attendance_total_hours_check
CHECK (total_hours IS NULL OR (total_hours >= 0 AND total_hours <= 24));

-- Vehicle logs: GPS coordinates validation
ALTER TABLE public.vehicle_logs
ADD CONSTRAINT vehicle_logs_start_lat_check 
CHECK (start_latitude IS NULL OR (start_latitude >= -90 AND start_latitude <= 90)),
ADD CONSTRAINT vehicle_logs_start_lon_check 
CHECK (start_longitude IS NULL OR (start_longitude >= -180 AND start_longitude <= 180)),
ADD CONSTRAINT vehicle_logs_end_lat_check 
CHECK (end_latitude IS NULL OR (end_latitude >= -90 AND end_latitude <= 90)),
ADD CONSTRAINT vehicle_logs_end_lon_check 
CHECK (end_longitude IS NULL OR (end_longitude >= -180 AND end_longitude <= 180));