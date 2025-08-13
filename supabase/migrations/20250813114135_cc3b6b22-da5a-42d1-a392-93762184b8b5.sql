-- Fix http_post function calls to use correct positional parameters syntax
-- Some functions still use named parameters which don't exist

CREATE OR REPLACE FUNCTION public.trigger_weekly_newsletter()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
BEGIN
  SELECT http_post(
    'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-weekly-newsletter',
    '{"trigger": "manual"}',
    'application/json'
  ) INTO result;
  
  RETURN 'Weekly newsletter triggered: ' || result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_featured_story_promotion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
BEGIN
  SELECT http_post(
    'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-featured-story-promotion',
    '{"trigger": "cron"}',
    'application/json'
  ) INTO result;
  
  RETURN 'Featured story promotion emails triggered: ' || result;
END;
$function$;