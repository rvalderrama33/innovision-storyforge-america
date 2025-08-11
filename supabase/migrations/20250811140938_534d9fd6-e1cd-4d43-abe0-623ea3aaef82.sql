-- Drop and recreate the view with SECURITY INVOKER to ensure it respects user permissions
DROP VIEW IF EXISTS public.published_articles;

-- Create the view with SECURITY INVOKER (default) to ensure RLS policies are respected
CREATE VIEW public.published_articles 
WITH (security_invoker = true) AS
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
  city,
  state,
  website,
  social_media,
  'Published by America Innovates Magazine' as attribution
FROM public.submissions 
WHERE status = 'approved' 
  AND generated_article IS NOT NULL;

-- Grant access to the secure view
GRANT SELECT ON public.published_articles TO anon;
GRANT SELECT ON public.published_articles TO authenticated;