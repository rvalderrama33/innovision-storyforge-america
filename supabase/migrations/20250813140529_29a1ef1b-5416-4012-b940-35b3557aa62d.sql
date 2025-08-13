-- Use the text signature that exists (uri text, content text, content_type text)
-- Update trigger functions to use TEXT parameters instead of CHARACTER VARYING

CREATE OR REPLACE FUNCTION public.send_new_submission_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result TEXT;
BEGIN
  -- Send admin notification for new submissions using TEXT parameters
  SELECT http_post(
    'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::text,
    json_build_object(
      'type', 'submission_notification',
      'submissionId', NEW.id::text
    )::text,
    'application/json'::text
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
    -- Use TEXT parameters
    SELECT http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::text,
      json_build_object(
        'type', 'approval',
        'submissionId', NEW.id::text
      )::text,
      'application/json'::text
    ) INTO result;
    
    -- Log the result (will appear in postgres logs)
    RAISE NOTICE 'Approval email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;