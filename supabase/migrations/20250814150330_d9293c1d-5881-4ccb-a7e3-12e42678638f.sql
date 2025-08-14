-- Update database function to use centralized email system instead of dedicated function
-- This replaces the old send-featured-story-promotion function calls

-- Remove the old cron job first
SELECT cron.unschedule('featured-story-promotion-emails');

-- Update the trigger_featured_story_promotion function to use the centralized email system
CREATE OR REPLACE FUNCTION public.trigger_featured_story_promotion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
  submission_record RECORD;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Get approved submissions from the last 24 hours that are not featured
  FOR submission_record IN
    SELECT id, email, full_name, product_name
    FROM public.submissions 
    WHERE status = 'approved' 
      AND featured = false 
      AND approved_at >= now() - interval '24 hours'
      AND email IS NOT NULL
  LOOP
    BEGIN
      -- Use the centralized send-email function instead
      SELECT http_post(
        'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-email',
        json_build_object(
          'type', 'featured_story_promotion',
          'to', submission_record.email,
          'name', submission_record.full_name,
          'productName', submission_record.product_name,
          'submissionId', submission_record.id::text
        )::text,
        'application/json'
      ) INTO result;
      
      success_count := success_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'Failed to send email for submission %: %', submission_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN format('Featured story promotion emails sent: %s successful, %s failed', success_count, error_count);
END;
$function$;

-- Recreate the cron job with the updated function
SELECT cron.schedule(
  'featured-story-promotion-emails',
  '0 10 * * *', -- Daily at 10 AM
  'SELECT public.trigger_featured_story_promotion();'
);