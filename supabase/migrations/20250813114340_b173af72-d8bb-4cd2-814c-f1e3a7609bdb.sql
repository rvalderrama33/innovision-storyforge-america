-- Fix remaining http_post functions to use correct positional parameters syntax

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
    'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
    json_build_object(
      'type', 'submission_notification',
      'submissionId', NEW.id::text
    )::text,
    'application/json'
  ) INTO result;
  
  -- Log the result
  RAISE NOTICE 'Admin notification trigger result: %', result;
  
  RETURN NEW;
END;
$function$;

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
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
      json_build_object(
        'type', 'approval',
        'submissionId', NEW.id::text
      )::text,
      'application/json'
    ) INTO result;
    
    -- Log the result (will appear in postgres logs)
    RAISE NOTICE 'Approval email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;

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
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails',
      json_build_object(
        'type', 'welcome',
        'subscriberId', NEW.id::text
      )::text,
      'application/json'
    ) INTO result;
    
    -- Log the result
    RAISE NOTICE 'Welcome email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;