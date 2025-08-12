-- Disable automatic newsletter subscription on user signup
-- This stops unwanted emails from being sent to new users

-- First, let's remove the trigger that automatically subscribes users to newsletter
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to NOT automatically subscribe to newsletter
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  
  -- Insert into user_roles table with default 'subscriber' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'subscriber')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- DO NOT automatically subscribe to newsletter anymore
  -- Users must explicitly opt-in to receive emails
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger for user creation (without auto newsletter subscription)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();