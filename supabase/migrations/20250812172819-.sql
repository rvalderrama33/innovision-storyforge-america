-- Complete the security enhancement for submissions table
-- Some policies were created, now ensure all are properly configured

-- Drop and recreate all policies to ensure consistency
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anonymous can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.submissions;

-- Recreate all policies with comprehensive security
CREATE POLICY "Authenticated users can create submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
);

CREATE POLICY "Anonymous can create submissions"
ON public.submissions
FOR INSERT
TO anon
WITH CHECK (
  auth.uid() IS NULL
  AND email IS NOT NULL
  AND full_name IS NOT NULL
  AND product_name IS NOT NULL
  AND email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "Users can view own submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
);

CREATE POLICY "Admins can view all submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
)
WITH CHECK (
  email = get_user_email()
);

CREATE POLICY "Admins can update submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions"
ON public.submissions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));