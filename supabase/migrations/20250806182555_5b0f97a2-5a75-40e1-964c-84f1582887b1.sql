-- Create cron job to automatically send featured story promotion emails
-- This will run daily at 10 AM to send upgrade emails to stories approved 24 hours ago
SELECT cron.schedule(
  'featured-story-promotion-emails',
  '0 10 * * *', -- Daily at 10 AM
  $$
  SELECT
    net.http_post(
        url:='https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-featured-story-promotion',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);