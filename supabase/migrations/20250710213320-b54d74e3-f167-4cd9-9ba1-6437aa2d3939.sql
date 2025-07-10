-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly newsletter generation every Monday at 9 AM Eastern Time
SELECT cron.schedule(
  'weekly-newsletter-generation',
  '0 13 * * 1', -- 1 PM UTC = 9 AM EST (adjust for daylight saving)
  $$
  SELECT
    net.http_post(
        url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-weekly-newsletter',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to manually trigger weekly newsletter (for testing)
CREATE OR REPLACE FUNCTION public.trigger_weekly_newsletter()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT net.http_post(
    url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-weekly-newsletter',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
    body:='{"trigger": "manual"}'::jsonb
  ) INTO result;
  
  RETURN 'Weekly newsletter triggered: ' || result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;