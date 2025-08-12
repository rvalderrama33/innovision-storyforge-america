-- Fix security definer view issue
-- Drop the existing view and recreate it without SECURITY DEFINER

DROP VIEW IF EXISTS public.published_articles_public;

-- Recreate the view without SECURITY DEFINER (defaults to SECURITY INVOKER)
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
            TRIM(BOTH FROM split_part(submissions.full_name, ' ', 1)) ||
            CASE
                WHEN TRIM(BOTH FROM split_part(submissions.full_name, ' ', 2)) <> '' THEN 
                    (' ' || LEFT(TRIM(BOTH FROM split_part(submissions.full_name, ' ', 2)), 1)) || '.'
                ELSE ''
            END
        ELSE NULL
    END AS display_name,
    submissions.city,
    submissions.state,
    submissions.website,
    submissions.social_media
FROM submissions
WHERE submissions.status = 'approved';

-- Grant select permissions to anon and authenticated users since this is public data
GRANT SELECT ON public.published_articles_public TO anon;
GRANT SELECT ON public.published_articles_public TO authenticated;