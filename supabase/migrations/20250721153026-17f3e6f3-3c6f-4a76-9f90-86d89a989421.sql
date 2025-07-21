-- Update the existing handle_new_user function to also subscribe users to newsletter
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  
  -- Insert into user_roles table with default 'subscriber' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'subscriber');
  
  -- Automatically subscribe to newsletter
  INSERT INTO public.newsletter_subscribers (email, full_name, subscription_source, confirmed_at, is_active)
  VALUES (
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    'auto_signup',
    now(),
    true
  );
  
  RETURN new;
END;
$$;