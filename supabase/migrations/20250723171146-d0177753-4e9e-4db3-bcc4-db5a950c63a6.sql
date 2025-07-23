-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to trigger the featured story promotion emails
CREATE OR REPLACE FUNCTION public.trigger_featured_story_promotion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result TEXT;
BEGIN
  SELECT net.http_post(
    url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-featured-story-promotion',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
    body:='{"trigger": "cron"}'::jsonb
  ) INTO result;
  
  RETURN 'Featured story promotion emails triggered: ' || result;
END;
$function$

-- Schedule the function to run every hour to check for stories that need promotion emails
SELECT cron.schedule(
  'featured-story-promotion-emails',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT public.trigger_featured_story_promotion();
  $$
);