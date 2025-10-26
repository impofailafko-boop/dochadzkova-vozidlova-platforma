-- Create function to delete user account
-- This function allows authenticated users to delete their own account
-- All related data will be automatically deleted due to CASCADE constraints
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Get the current user's ID
  _user_id := auth.uid();
  
  -- Check if user is authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete the user from auth.users
  -- This will cascade delete all related data from:
  -- - profiles
  -- - user_roles
  -- - attendance
  -- - vehicle_logs
  -- - fuel_logs
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;