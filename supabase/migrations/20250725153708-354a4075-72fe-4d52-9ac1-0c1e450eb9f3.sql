-- Add IP address and user agent tracking to admin actions for security monitoring
ALTER TABLE public.admin_actions 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create index for security monitoring queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_ip_address ON public.admin_actions(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- Update admin action logging function to capture more security context
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type text, 
  _target_user_id uuid DEFAULT NULL::uuid, 
  _target_resource text DEFAULT NULL::text, 
  _description text DEFAULT NULL::text,
  _ip_address text DEFAULT NULL::text,
  _user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.admin_actions (
    admin_user_id,
    action_type,
    target_user_id,
    target_resource,
    description,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _action_type,
    _target_user_id,
    _target_resource,
    _description,
    _ip_address::inet,
    _user_agent
  );
END;
$function$;