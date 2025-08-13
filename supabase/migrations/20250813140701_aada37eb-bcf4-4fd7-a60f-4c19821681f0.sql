-- Simplify the trigger functions to just use text result
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
  BEGIN
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::character varying,
      json_build_object(
        'type', 'submission_notification',
        'submissionId', NEW.id::text
      )::text::character varying,
      'application/json'::character varying
    )).content INTO result;
    
    -- Log the result
    RAISE NOTICE 'Admin notification trigger result: %', result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Admin notification trigger error: %', SQLERRM;
  END;
  
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
    BEGIN
      SELECT (http_post(
        'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::character varying,
        json_build_object(
          'type', 'approval',
          'submissionId', NEW.id::text
        )::text::character varying,
        'application/json'::character varying
      )).content INTO result;
      
      -- Log the result
      RAISE NOTICE 'Approval email trigger result: %', result;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Approval email trigger error: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Execute the comprehensive test
SELECT test_submission_triggers() as test_result;