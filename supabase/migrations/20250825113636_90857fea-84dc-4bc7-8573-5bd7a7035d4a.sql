-- Fix security issue: Remove public access to sensitive customer data in submissions table

-- Drop the policy that allows anyone to view approved submissions
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.submissions;

-- Recreate the published_articles_public view to ensure it only contains safe, non-sensitive data
-- This removes sensitive fields like email, phone_number, background, etc.
DROP VIEW IF EXISTS public.published_articles_public;

CREATE VIEW public.published_articles_public AS
SELECT 
  id,
  created_at,
  updated_at,
  approved_at,
  featured,
  pinned,
  is_manual_submission,
  full_name as display_name,  -- Keep display name but not email
  city,
  state,
  website,
  social_media,
  product_name,
  category,
  description,
  problem_solved,
  stage,
  idea_origin,
  biggest_challenge,
  proudest_moment,
  motivation,
  inspiration,
  generated_article,
  image_urls,
  banner_image,
  headshot_image,
  logo_image,
  slug,
  source_links,
  selected_vendors
FROM public.submissions 
WHERE status = 'approved';

-- Grant SELECT permission on the public view to anonymous users
GRANT SELECT ON public.published_articles_public TO anon;
GRANT SELECT ON public.published_articles_public TO authenticated;

-- Enable RLS on the view (optional but good practice)
ALTER VIEW public.published_articles_public SET (security_invoker = on);

-- Create a policy for the public view (even though it's already filtered)
-- This provides defense in depth
CREATE POLICY "Public can view published articles" 
ON public.published_articles_public 
FOR SELECT 
TO public 
USING (true);