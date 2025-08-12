-- Fix function search path security warning by properly handling dependencies
-- Drop trigger first, then function, then recreate both

DROP TRIGGER IF EXISTS audit_submission_changes ON public.submissions;
DROP FUNCTION IF EXISTS log_submission_access();

-- Create function with proper search path to fix security warning
CREATE OR REPLACE FUNCTION log_submission_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log access to sensitive submission data for security monitoring
  INSERT INTO public.admin_actions (
    admin_user_id,
    action_type,
    target_resource,
    description
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'submission_access',
    'submissions',
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 'Updated submission: ' || NEW.id::text
      WHEN TG_OP = 'DELETE' THEN 'Deleted submission: ' || OLD.id::text
      ELSE TG_OP || ' on submission'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the audit trigger
CREATE TRIGGER audit_submission_changes
  AFTER UPDATE OR DELETE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_submission_access();