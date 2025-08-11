-- Drop the problematic policy that queries auth.users directly
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;

-- Create a better policy that works with the profiles table instead
CREATE POLICY "Users can view own submissions" 
ON public.submissions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND email = (
    SELECT profiles.email
    FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Also ensure the policy works correctly by testing with a simpler approach
-- Let's also create an alternative policy that uses auth.email() function if available
-- But first, let's try a different approach that doesn't query auth.users

-- Drop and recreate with a safer approach
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;

-- Create policy that uses a security definer function to safely get user email
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Now create the policy using this function
CREATE POLICY "Users can view own submissions" 
ON public.submissions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND email = get_user_email()
);