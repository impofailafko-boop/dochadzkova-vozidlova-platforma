-- Delete all test users and their data
-- Keep only the structure clean

-- Delete from auth.users (cascades to profiles, user_roles, attendance, vehicle_logs, fuel_logs)
DELETE FROM auth.users WHERE email != 'zivcakpatrik@gmail.com';

-- Delete the existing zivcakpatrik@gmail.com if exists (to allow fresh registration)
DELETE FROM auth.users WHERE email = 'zivcakpatrik@gmail.com';