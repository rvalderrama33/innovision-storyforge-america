-- Enable the http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Update the send_new_submission_notification function to use http_post correctly
CREATE OR REPLACE FUNCTION public.send_new_submission_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
BEGIN
  -- Send admin notification for new submissions
  SELECT http_post(
    url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}',
    body := json_build_object(
      'type', 'submission_notification',
      'submissionId', NEW.id::text
    )::text
  ) INTO result;
  
  -- Log the result
  RAISE NOTICE 'Admin notification trigger result: %', result;
  
  RETURN NEW;
END;
$function$;

-- Update the send_submission_approval_email function to use http_post correctly
CREATE OR REPLACE FUNCTION public.send_submission_approval_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
BEGIN
  -- Only send email if status changed to approved and we have the required data
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.email IS NOT NULL THEN
    -- Call the automatic email edge function with service role key
    SELECT http_post(
      url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}',
      body := json_build_object(
        'type', 'approval',
        'submissionId', NEW.id::text
      )::text
    ) INTO result;
    
    -- Log the result (will appear in postgres logs)
    RAISE NOTICE 'Approval email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;