-- One-time cleanup of existing draft submissions
-- This will keep only the most recent draft per email and delete older ones

WITH ranked_drafts AS (
  SELECT id, email, created_at,
    ROW_NUMBER() OVER (
      PARTITION BY email 
      ORDER BY created_at DESC
    ) as row_num
  FROM public.submissions 
  WHERE status = 'draft' 
    AND email IS NOT NULL
),
drafts_to_delete AS (
  SELECT id 
  FROM ranked_drafts 
  WHERE row_num > 1
)
DELETE FROM public.submissions 
WHERE id IN (SELECT id FROM drafts_to_delete);

-- Log the cleanup for reference
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % duplicate draft submissions', deleted_count;
END $$;