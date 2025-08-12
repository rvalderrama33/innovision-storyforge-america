-- Update all remaining functions to use http_post instead of net.http_post

-- Update trigger_weekly_newsletter function
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
    url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-weekly-newsletter',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
    body:='{"trigger": "manual"}'::jsonb
  ) INTO result;
  
  RETURN 'Weekly newsletter triggered: ' || result;
END;
$function$;

-- Update trigger_featured_story_promotion function
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
    url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-featured-story-promotion',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
    body:='{"trigger": "cron"}'::jsonb
  ) INTO result;
  
  RETURN 'Featured story promotion emails triggered: ' || result;
END;
$function$;

-- Update send_welcome_email_to_subscriber function
CREATE OR REPLACE FUNCTION public.send_welcome_email_to_subscriber()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
BEGIN
  -- Send welcome email when subscriber is confirmed
  IF NEW.confirmed_at IS NOT NULL AND (OLD.confirmed_at IS NULL OR OLD.confirmed_at != NEW.confirmed_at) THEN
    -- Call the automatic email edge function with service role key
    SELECT http_post(
      url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}',
      body := json_build_object(
        'type', 'welcome',
        'subscriberId', NEW.id::text
      )::text
    ) INTO result;
    
    -- Log the result
    RAISE NOTICE 'Welcome email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;