-- Create super admin role assignment protection
CREATE OR REPLACE FUNCTION public.assign_admin_role(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_id uuid;
  is_super_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is super admin
  SELECT has_role(current_user_id, 'super_admin') INTO is_super_admin;
  
  -- Only super admins can assign admin roles
  IF NOT is_super_admin THEN
    RAISE EXCEPTION 'Only super admins can assign admin roles';
  END IF;
  
  -- Insert the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  PERFORM log_admin_action(
    'role_assignment',
    _target_user_id,
    'user_roles',
    'Assigned admin role to user'
  );
  
  RETURN true;
END;
$function$;

-- Create function to revoke admin roles (super admin only)
CREATE OR REPLACE FUNCTION public.revoke_admin_role(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_id uuid;
  is_super_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is super admin
  SELECT has_role(current_user_id, 'super_admin') INTO is_super_admin;
  
  -- Only super admins can revoke admin roles
  IF NOT is_super_admin THEN
    RAISE EXCEPTION 'Only super admins can revoke admin roles';
  END IF;
  
  -- Prevent revoking super admin roles
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _target_user_id AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Cannot revoke super admin role';
  END IF;
  
  -- Remove the admin role
  DELETE FROM public.user_roles 
  WHERE user_id = _target_user_id AND role = 'admin';
  
  -- Log the action
  PERFORM log_admin_action(
    'role_revocation',
    _target_user_id,
    'user_roles',
    'Revoked admin role from user'
  );
  
  RETURN true;
END;
$function$;

-- Create account lockout table for failed login attempts
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone,
  last_attempt timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for account lockouts
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON public.account_lockouts(email);

-- Enable RLS on account lockouts
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Create policy for account lockouts (admin only)
CREATE POLICY "Admins can manage account lockouts"
ON public.account_lockouts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create function to check and handle account lockouts
CREATE OR REPLACE FUNCTION public.handle_failed_login(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  lockout_record record;
  max_attempts integer := 5;
  lockout_duration interval := '30 minutes';
BEGIN
  -- Get or create lockout record
  SELECT * INTO lockout_record 
  FROM public.account_lockouts 
  WHERE email = _email;
  
  -- If no record exists, create one
  IF lockout_record IS NULL THEN
    INSERT INTO public.account_lockouts (email, failed_attempts, last_attempt)
    VALUES (_email, 1, now());
    RETURN true; -- Account not locked
  END IF;
  
  -- Check if account is currently locked
  IF lockout_record.locked_until IS NOT NULL AND lockout_record.locked_until > now() THEN
    RETURN false; -- Account is locked
  END IF;
  
  -- Increment failed attempts
  UPDATE public.account_lockouts 
  SET failed_attempts = failed_attempts + 1,
      last_attempt = now(),
      locked_until = CASE 
        WHEN failed_attempts + 1 >= max_attempts THEN now() + lockout_duration
        ELSE NULL
      END
  WHERE email = _email;
  
  -- Return whether account is now locked
  RETURN NOT (lockout_record.failed_attempts + 1 >= max_attempts);
END;
$function$;

-- Create function to reset successful login
CREATE OR REPLACE FUNCTION public.reset_login_attempts(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.account_lockouts 
  SET failed_attempts = 0,
      locked_until = NULL,
      last_attempt = now()
  WHERE email = _email;
END;
$function$;