-- Fáza 1: Databázové constraints pre validáciu dát

-- ========================================
-- PROFILES TABLE CONSTRAINTS
-- ========================================

-- Full name validácia
ALTER TABLE profiles 
ADD CONSTRAINT check_full_name_length 
CHECK (length(trim(full_name)) >= 2 AND length(full_name) <= 100);

ALTER TABLE profiles 
ADD CONSTRAINT check_full_name_not_empty 
CHECK (trim(full_name) != '');

-- Phone validácia (voliteľné)
ALTER TABLE profiles 
ADD CONSTRAINT check_phone_format 
CHECK (
  phone IS NULL OR 
  phone = '' OR 
  phone ~ '^\+?[1-9]\d{1,14}$'
);

-- Email validácia
ALTER TABLE profiles 
ADD CONSTRAINT check_email_length 
CHECK (email IS NULL OR length(email) <= 255);

-- ========================================
-- FUEL_LOGS TABLE CONSTRAINTS
-- ========================================

-- Liters validácia
ALTER TABLE fuel_logs 
ADD CONSTRAINT check_liters_positive 
CHECK (liters > 0 AND liters <= 500);

-- Price validácia
ALTER TABLE fuel_logs 
ADD CONSTRAINT check_price_valid 
CHECK (price IS NULL OR (price >= 0 AND price <= 10000));

-- Note validácia
ALTER TABLE fuel_logs 
ADD CONSTRAINT check_note_length 
CHECK (note IS NULL OR length(note) <= 500);

-- Date validácia
ALTER TABLE fuel_logs 
ADD CONSTRAINT check_date_not_future 
CHECK (date <= CURRENT_DATE);

-- ========================================
-- VEHICLE_LOGS TABLE CONSTRAINTS
-- ========================================

-- Km start validácia
ALTER TABLE vehicle_logs 
ADD CONSTRAINT check_km_start_valid 
CHECK (km_start >= 0 AND km_start <= 9999999);

-- Km end validácia
ALTER TABLE vehicle_logs 
ADD CONSTRAINT check_km_end_valid 
CHECK (km_end IS NULL OR (km_end >= km_start AND km_end <= 9999999));

-- Km driven validácia
ALTER TABLE vehicle_logs 
ADD CONSTRAINT check_km_driven_matches 
CHECK (
  km_driven IS NULL OR 
  (km_end IS NOT NULL AND km_driven = (km_end - km_start))
);

-- Date validácia
ALTER TABLE vehicle_logs 
ADD CONSTRAINT check_vehicle_date_not_future 
CHECK (date <= CURRENT_DATE);

-- ========================================
-- ATTENDANCE TABLE CONSTRAINTS
-- ========================================

-- Date validácia
ALTER TABLE attendance 
ADD CONSTRAINT check_attendance_date_not_future 
CHECK (date <= CURRENT_DATE);

-- Total hours validácia
ALTER TABLE attendance 
ADD CONSTRAINT check_total_hours_valid 
CHECK (total_hours IS NULL OR (total_hours >= 0 AND total_hours <= 24));

-- Departure after arrival validácia
ALTER TABLE attendance 
ADD CONSTRAINT check_departure_after_arrival 
CHECK (
  departure_time IS NULL OR 
  arrival_time IS NULL OR 
  departure_time > arrival_time
);

-- GPS latitude validácia
ALTER TABLE attendance 
ADD CONSTRAINT check_latitude_valid 
CHECK (
  (arrival_latitude IS NULL OR (arrival_latitude >= -90 AND arrival_latitude <= 90)) AND
  (departure_latitude IS NULL OR (departure_latitude >= -90 AND departure_latitude <= 90))
);

-- GPS longitude validácia
ALTER TABLE attendance 
ADD CONSTRAINT check_longitude_valid 
CHECK (
  (arrival_longitude IS NULL OR (arrival_longitude >= -180 AND arrival_longitude <= 180)) AND
  (departure_longitude IS NULL OR (departure_longitude >= -180 AND departure_longitude <= 180))
);