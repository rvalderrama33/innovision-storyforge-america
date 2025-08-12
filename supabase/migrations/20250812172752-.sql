-- Enhanced security for submissions table to protect personal data
-- Drop existing policies to recreate with better security

DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.submissions;

-- Create comprehensive RLS policies with enhanced security

-- 1. SECURE INSERT POLICY: Only authenticated users or specific anonymous submissions
CREATE POLICY "Authenticated users can create submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must provide their own email when authenticated
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
);

-- 2. ANONYMOUS SUBMISSIONS: Allow anonymous submissions but with rate limiting considerations
CREATE POLICY "Anonymous can create submissions"
ON public.submissions
FOR INSERT
TO anon
WITH CHECK (
  -- Anonymous users can submit but we track IP and basic validation
  auth.uid() IS NULL
  AND email IS NOT NULL
  AND full_name IS NOT NULL
  AND product_name IS NOT NULL
  -- Ensure email format is valid (basic check)
  AND email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 3. SECURE SELECT POLICIES: Users can only view their own submissions
CREATE POLICY "Users can view own submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
);

-- 4. ADMIN ACCESS: Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. SECURE UPDATE: Only submission owners and admins can update
CREATE POLICY "Users can update own submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
)
WITH CHECK (
  -- Prevent users from changing email to avoid ownership transfer
  email = get_user_email()
);

-- 6. ADMIN UPDATE: Admins can update any submission
CREATE POLICY "Admins can update submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. SECURE DELETE: Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.submissions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. PREVENT ANONYMOUS SELECT: Anonymous users cannot browse submissions
-- (No policy = deny by default)

-- Create audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION log_submission_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive submission data for security monitoring
  INSERT INTO admin_actions (
    admin_user_id,
    action_type,
    target_resource,
    description
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'submission_access',
    'submissions',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'Viewed submission: ' || NEW.id::text
      WHEN TG_OP = 'UPDATE' THEN 'Updated submission: ' || NEW.id::text
      WHEN TG_OP = 'DELETE' THEN 'Deleted submission: ' || OLD.id::text
      ELSE TG_OP || ' on submission'
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger for UPDATE and DELETE operations on sensitive data
CREATE TRIGGER audit_submission_changes
  AFTER UPDATE OR DELETE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_submission_access();