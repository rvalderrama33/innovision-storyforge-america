-- Update triggers to call the automatic email edge function
CREATE OR REPLACE FUNCTION public.send_submission_approval_email()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Only send email if status changed to approved and we have the required data
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.email IS NOT NULL THEN
    -- Call the automatic email edge function
    SELECT net.http_post(
      url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
      body := json_build_object(
        'type', 'approval',
        'submissionId', NEW.id::text
      )::text
    ) INTO result;
    
    -- Log the result
    RAISE NOTICE 'Approval email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_welcome_email_to_subscriber()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Send welcome email when subscriber is confirmed
  IF NEW.confirmed_at IS NOT NULL AND (OLD.confirmed_at IS NULL OR OLD.confirmed_at != NEW.confirmed_at) THEN
    -- Call the automatic email edge function
    SELECT net.http_post(
      url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
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
$$;

CREATE OR REPLACE FUNCTION public.send_new_submission_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Send admin notification for new submissions
  SELECT net.http_post(
    url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}',
    body := json_build_object(
      'type', 'submission_notification',
      'submissionId', NEW.id::text
    )::text
  ) INTO result;
  
  -- Log the result
  RAISE NOTICE 'Admin notification trigger result: %', result;
  
  RETURN NEW;
END;
$$;