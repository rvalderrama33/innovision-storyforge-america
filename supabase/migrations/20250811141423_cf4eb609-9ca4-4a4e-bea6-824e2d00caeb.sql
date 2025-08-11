-- Remove the overly broad public access policy that exposes personal data
DROP POLICY IF EXISTS "Public can view approved articles" ON public.submissions;

-- Create a much more restrictive policy that only allows access to non-sensitive article data
-- This policy will work with our published_articles view but restricts direct table access
CREATE POLICY "Public can view article content only" 
ON public.submissions 
FOR SELECT 
USING (
  status = 'approved' 
  AND generated_article IS NOT NULL
  -- This policy exists mainly for the view, direct access should use the view instead
);

-- Since we want to completely prevent direct access to sensitive personal data,
-- let's create a policy that blocks access to sensitive columns for non-admins
-- We'll update the RLS to be more granular

-- Actually, let's take a different approach and remove public table access entirely
-- The public should only use the published_articles view

DROP POLICY IF EXISTS "Public can view article content only" ON public.submissions;

-- No public access to submissions table directly - only through the secure view
-- Only authenticated users can access their own data, and admins can access all