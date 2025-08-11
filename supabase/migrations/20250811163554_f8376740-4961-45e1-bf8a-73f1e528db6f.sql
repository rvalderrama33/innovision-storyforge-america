-- First, update the published_articles view to include all necessary columns from submissions
DROP VIEW IF EXISTS public.published_articles;

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