-- The issue is that our triggers are passing parameters that don't match existing signatures
-- Let's fix the trigger functions to use proper type casting

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
  -- Cast parameters to character varying to match http_post signature
  SELECT http_post(
    'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::character varying,
    json_build_object(
      'type', 'submission_notification',
      'submissionId', NEW.id::text
    )::text::character varying,
    'application/json'::character varying
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
    -- Cast parameters to character varying to match http_post signature
    SELECT http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::character varying,
      json_build_object(
        'type', 'approval',
        'submissionId', NEW.id::text
      )::text::character varying,
      'application/json'::character varying
    ) INTO result;
    
    -- Log the result (will appear in postgres logs)
    RAISE NOTICE 'Approval email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;