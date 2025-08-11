-- Fix critical privacy issue: Remove public access to sensitive personal information
-- Drop the overly permissive policy that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.submissions;

-- Create a secure public view that only exposes safe, non-sensitive fields
CREATE VIEW public.published_articles_public AS
SELECT 
  id,
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
  selected_vendors,
  pinned,
  is_manual_submission,
  featured,
  approved_at,
  created_at,
  updated_at,
  -- Only show first name and last initial for privacy
  CASE 
    WHEN full_name IS NOT NULL THEN 
      TRIM(SPLIT_PART(full_name, ' ', 1)) || 
      CASE 
        WHEN TRIM(SPLIT_PART(full_name, ' ', 2)) != '' THEN 
          ' ' || LEFT(TRIM(SPLIT_PART(full_name, ' ', 2)), 1) || '.'
        ELSE ''
      END
    ELSE NULL
  END as display_name,
  -- Only show city and state, no specific addresses
  city,
  state,
  -- Only show website if provided (no email/phone)
  website,
  social_media
FROM public.submissions
WHERE status = 'approved';

-- Enable RLS on the view (this doesn't work on views, but we'll handle access through grants)
-- COMMENT: Views inherit permissions from underlying tables

-- Grant public read access to the safe public view
GRANT SELECT ON public.published_articles_public TO authenticated;
GRANT SELECT ON public.published_articles_public TO anon;

-- Ensure the original submissions table is properly protected
-- Keep existing policies intact for admin/user access