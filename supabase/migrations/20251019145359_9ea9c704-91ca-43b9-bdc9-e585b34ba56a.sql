-- Drop existing foreign keys if they exist and recreate them

-- Drop and recreate foreign key from attendance to profiles
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_user_id_fkey;
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Drop and recreate foreign key from fuel_logs to profiles
ALTER TABLE public.fuel_logs DROP CONSTRAINT IF EXISTS fuel_logs_user_id_fkey;
ALTER TABLE public.fuel_logs
ADD CONSTRAINT fuel_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Drop and recreate foreign key from fuel_logs to vehicles
ALTER TABLE public.fuel_logs DROP CONSTRAINT IF EXISTS fuel_logs_vehicle_id_fkey;
ALTER TABLE public.fuel_logs
ADD CONSTRAINT fuel_logs_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) 
REFERENCES public.vehicles(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign key from vehicle_logs to profiles
ALTER TABLE public.vehicle_logs DROP CONSTRAINT IF EXISTS vehicle_logs_user_id_fkey;
ALTER TABLE public.vehicle_logs
ADD CONSTRAINT vehicle_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Drop and recreate foreign key from vehicle_logs to vehicles
ALTER TABLE public.vehicle_logs DROP CONSTRAINT IF EXISTS vehicle_logs_vehicle_id_fkey;
ALTER TABLE public.vehicle_logs
ADD CONSTRAINT vehicle_logs_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) 
REFERENCES public.vehicles(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign key from vehicle_logs to projects
ALTER TABLE public.vehicle_logs DROP CONSTRAINT IF EXISTS vehicle_logs_project_id_fkey;
ALTER TABLE public.vehicle_logs
ADD CONSTRAINT vehicle_logs_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;

-- Drop and recreate foreign key from user_roles to profiles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;