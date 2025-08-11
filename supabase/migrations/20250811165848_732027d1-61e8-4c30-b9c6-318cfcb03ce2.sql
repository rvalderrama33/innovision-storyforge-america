-- Fix Security Definer View issue by recreating published_articles view with proper security
-- Drop the existing view that bypasses RLS
DROP VIEW IF EXISTS public.published_articles;

-- Recreate the view without SECURITY DEFINER to respect RLS policies
CREATE VIEW public.published_articles AS
SELECT 
  id,
  full_name,
  email,
  city,
  state,
  background,
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
  generated_article,
  image_urls,
  status,
  slug,
  source_links,
  phone_number,
  selected_vendors,
  banner_image,
  headshot_image,
  logo_image,
  pinned,
  is_manual_submission,
  featured,
  approved_at,
  approved_by,
  updated_at,
  created_at,
  inspiration,
  recommendations
FROM public.submissions
WHERE status = 'approved';

-- Enable RLS on the view
ALTER TABLE public.published_articles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to approved articles only
CREATE POLICY "Anyone can view published articles" 
ON public.published_articles 
FOR SELECT 
USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.published_articles TO authenticated;
GRANT SELECT ON public.published_articles TO anon;