-- Update Lori Greiner's slug to be URL-friendly based on her article title
UPDATE submissions 
SET slug = 'lori-greiner-the-queen-of-qvc-and-shark-tank-sensation-transforming-ideas-into-gold'
WHERE id = 'a67c4e65-c8d1-4a13-a481-0bcaf4041be0';

-- Update any other submissions that still have generic article-* slugs with proper URL-friendly slugs
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
WHERE slug LIKE 'article-%' OR slug IS NULL OR slug = '';