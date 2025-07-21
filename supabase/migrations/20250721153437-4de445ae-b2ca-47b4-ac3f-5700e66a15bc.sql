-- Update the weekly newsletter schedule from 9 AM to 5 PM Eastern Time
-- First, unschedule the existing job
SELECT cron.unschedule('weekly-newsletter-generation');

-- Schedule weekly newsletter generation every Monday at 5 PM Eastern Time
SELECT cron.schedule(
  'weekly-newsletter-generation',
  '0 21 * * 1', -- 9 PM UTC = 5 PM EST (adjust for daylight saving)
  $$
  SELECT
    net.http_post(
        url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-weekly-newsletter',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);