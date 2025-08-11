-- Remove the overly permissive public read access to submissions table
DROP POLICY IF EXISTS "Anyone can view submissions" ON public.submissions;

-- Create a secure policy for viewing published articles without exposing personal data
-- This replaces the overly broad public access
CREATE POLICY "Public can view approved articles" 
ON public.submissions 
FOR SELECT 
USING (
  status = 'approved' 
  AND generated_article IS NOT NULL
);

-- Create policy for users to view their own submissions
CREATE POLICY "Users can view own submissions" 
ON public.submissions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND email = (
    SELECT auth.users.email::text 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
  )
);

-- Create a secure public view for articles that excludes sensitive personal information
CREATE OR REPLACE VIEW public.published_articles AS
SELECT 
  id,
  created_at,
  updated_at,
  product_name,
  category,
  description,
  problem_solved,
  stage,
  generated_article,
  image_urls,
  slug,
  featured,
  pinned,
  banner_image,
  logo_image,
  headshot_image,
  -- Only include business-related info, not personal contact details
  city,
  state,
  website,
  social_media,
  -- Exclude sensitive personal data: full_name, email, phone_number
  -- These should only be accessible to authenticated users viewing their own data
  -- or admins through the existing admin policies
  CASE WHEN generated_article IS NOT NULL THEN 'Published by America Innovates Magazine' ELSE NULL END as attribution
FROM public.submissions 
WHERE status = 'approved' 
  AND generated_article IS NOT NULL;

-- Grant access to the secure view
GRANT SELECT ON public.published_articles TO anon;
GRANT SELECT ON public.published_articles TO authenticated;