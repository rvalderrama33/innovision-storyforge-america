
-- Function to sync all admin users as newsletter subscribers
CREATE OR REPLACE FUNCTION sync_admin_newsletter_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert admin users who aren't already subscribed
  INSERT INTO public.newsletter_subscribers (email, full_name, subscription_source, confirmed_at, is_active)
  SELECT 
    p.email,
    p.full_name,
    'admin_sync' as subscription_source,
    now() as confirmed_at,
    true as is_active
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'admin'
    AND p.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.newsletter_subscribers ns 
      WHERE ns.email = p.email
    );
  
  -- Reactivate any deactivated admin subscriptions
  UPDATE public.newsletter_subscribers 
  SET is_active = true, 
      unsubscribed_at = null,
      subscription_source = 'admin_sync'
  WHERE email IN (
    SELECT p.email
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.email IS NOT NULL
  ) AND is_active = false;
END;
$$;

-- Run the function to sync existing admins
SELECT sync_admin_newsletter_subscriptions();

-- Update the handle_new_user function to automatically subscribe new admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  
  -- Default role is subscriber
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'subscriber');
  
  RETURN new;
END;
$$;

-- Create trigger to auto-subscribe admins when they get admin role (no welcome email)
CREATE OR REPLACE FUNCTION auto_subscribe_admin_to_newsletter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If a user is getting admin role, subscribe them to newsletter
  IF NEW.role = 'admin' THEN
    INSERT INTO public.newsletter_subscribers (email, full_name, subscription_source, confirmed_at, is_active)
    SELECT 
      p.email,
      p.full_name,
      'admin_auto' as subscription_source,
      now() as confirmed_at,
      true as is_active
    FROM public.profiles p
    WHERE p.id = NEW.user_id
      AND p.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.newsletter_subscribers ns 
        WHERE ns.email = p.email
      );
      
    -- Reactivate if they were previously unsubscribed
    UPDATE public.newsletter_subscribers 
    SET is_active = true, 
        unsubscribed_at = null,
        subscription_source = 'admin_auto'
    WHERE email = (SELECT email FROM public.profiles WHERE id = NEW.user_id)
      AND is_active = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_admin_role_assigned ON public.user_roles;
CREATE TRIGGER on_admin_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW 
  EXECUTE FUNCTION auto_subscribe_admin_to_newsletter();
