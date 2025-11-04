-- Remove the old insecure create_admin_account function
-- This function directly manipulated auth.users and bypassed Supabase Auth API
-- Replaced with secure edge function implementation

DROP FUNCTION IF EXISTS public.create_admin_account(text, text, text, text);