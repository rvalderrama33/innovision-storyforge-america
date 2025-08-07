-- Ensure profiles exist for all existing users
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email) as full_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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
  
  -- Automatically subscribe to newsletter
  INSERT INTO public.newsletter_subscribers (email, full_name, subscription_source, confirmed_at, is_active)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'auto_signup',
    now(),
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    confirmed_at = COALESCE(newsletter_subscribers.confirmed_at, now()),
    updated_at = now();
  
  RETURN NEW;
END;
$$;