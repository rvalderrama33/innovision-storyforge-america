-- Fix all article slugs to be URL-friendly based on article titles
UPDATE submissions 
SET slug = (
  CASE 
    WHEN generated_article IS NOT NULL AND generated_article != '' THEN
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              TRIM(REGEXP_REPLACE(SPLIT_PART(generated_article, E'\n', 1), '^#+\s*', '', 'g')),
              '[^a-zA-Z0-9\s\-]', '', 'g'
            ),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      )
    ELSE 
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            COALESCE(product_name, full_name, 'untitled'),
            '[^a-zA-Z0-9\s\-]', '', 'g'
          ),
          '\s+', '-', 'g'
        )
      )
  END
)
WHERE status = 'approved' AND (slug IS NULL OR slug = '' OR slug LIKE 'article-%');