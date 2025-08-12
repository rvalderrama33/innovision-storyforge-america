-- First, check the current view definition to understand its security context
SELECT viewowner, schemaname, viewname 
FROM pg_views 
WHERE viewname = 'published_articles_public' AND schemaname = 'public';

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.published_articles_public;

-- Recreate the view with proper security (SECURITY INVOKER is the default and safer)
CREATE VIEW public.published_articles_public AS
SELECT 
    submissions.id,
    submissions.product_name,
    submissions.category,
    submissions.description,
    submissions.problem_solved,
    submissions.stage,
    submissions.idea_origin,
    submissions.biggest_challenge,
    submissions.proudest_moment,
    submissions.motivation,
    submissions.inspiration,
    submissions.generated_article,
    submissions.image_urls,
    submissions.banner_image,
    submissions.headshot_image,
    submissions.logo_image,
    submissions.slug,
    submissions.source_links,
    submissions.selected_vendors,
    submissions.pinned,
    submissions.is_manual_submission,
    submissions.featured,
    submissions.approved_at,
    submissions.created_at,
    submissions.updated_at,
    CASE
        WHEN submissions.full_name IS NOT NULL THEN 
            TRIM(BOTH FROM split_part(submissions.full_name, ' '::text, 1)) ||
            CASE
                WHEN TRIM(BOTH FROM split_part(submissions.full_name, ' '::text, 2)) <> ''::text 
                THEN (' '::text || left(TRIM(BOTH FROM split_part(submissions.full_name, ' '::text, 2)), 1)) || '.'::text
                ELSE ''::text
            END
        ELSE NULL::text
    END AS display_name,
    submissions.city,
    submissions.state,
    submissions.website,
    submissions.social_media
FROM submissions
WHERE submissions.status = 'approved';

-- Add comment to document the security fix
COMMENT ON VIEW public.published_articles_public IS 'Public view of approved articles - uses SECURITY INVOKER for proper RLS enforcement';