-- Drop old phone format constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_phone_format;

-- Add new constraint for Slovak phone numbers in +421XXXXXXXXX format
ALTER TABLE profiles ADD CONSTRAINT check_phone_format 
CHECK (
  phone IS NULL OR 
  phone = '' OR
  phone ~ '^\+421[0-9]{9}$'
);

-- Update handle_new_user() trigger to normalize phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _phone text;
BEGIN
  -- Get phone from metadata
  _phone := NEW.raw_user_meta_data->>'phone';
  
  -- Normalize phone number to +421XXXXXXXXX format
  IF _phone IS NOT NULL AND _phone != '' THEN
    -- Remove all spaces and dashes
    _phone := regexp_replace(_phone, '[\s\-]', '', 'g');
    
    -- Convert 0XXXXXXXXX to +421XXXXXXXXX
    IF _phone ~ '^0[0-9]{9}$' THEN
      _phone := '+421' || substring(_phone from 2);
    -- Convert XXXXXXXXX to +421XXXXXXXXX
    ELSIF _phone ~ '^[0-9]{9}$' THEN
      _phone := '+421' || _phone;
    -- Convert 00421XXXXXXXXX to +421XXXXXXXXX
    ELSIF _phone ~ '^00421[0-9]{9}$' THEN
      _phone := '+421' || substring(_phone from 6);
    -- If already in +421XXXXXXXXX format, keep it
    ELSIF NOT _phone ~ '^\+421[0-9]{9}$' THEN
      -- Invalid format, set to NULL
      _phone := NULL;
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, full_name, email, phone, employment_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    _phone,
    NULL
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Normalize existing phone numbers in database
UPDATE profiles 
SET phone = '+421' || substring(phone from 2)
WHERE phone ~ '^0[0-9]{9}$';

UPDATE profiles 
SET phone = '+421' || phone
WHERE phone ~ '^[0-9]{9}$';

UPDATE profiles 
SET phone = '+421' || substring(phone from 6)
WHERE phone ~ '^00421[0-9]{9}$';