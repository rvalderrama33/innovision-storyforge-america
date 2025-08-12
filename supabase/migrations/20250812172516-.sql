-- Explicitly recreate view with SECURITY INVOKER to fix security definer issue
DROP VIEW IF EXISTS public.published_articles_public CASCADE;

-- Create view with explicit SECURITY INVOKER (this is the secure option)
CREATE VIEW public.published_articles_public 
WITH (security_invoker = true) AS
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

-- Grant appropriate permissions since this view shows only approved public content
GRANT SELECT ON public.published_articles_public TO anon;
GRANT SELECT ON public.published_articles_public TO authenticated;