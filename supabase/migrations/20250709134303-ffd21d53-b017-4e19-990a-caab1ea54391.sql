-- Update all articles with proper URL-friendly slugs
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
WHERE slug IS NULL OR slug = '' OR slug LIKE 'article-%';