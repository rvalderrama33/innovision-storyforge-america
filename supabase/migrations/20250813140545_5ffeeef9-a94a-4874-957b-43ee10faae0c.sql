-- Fix the welcome email function and execute test
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
    -- Use TEXT parameters
    SELECT http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-automatic-emails'::text,
      json_build_object(
        'type', 'welcome',
        'subscriberId', NEW.id::text
      )::text,
      'application/json'::text
    ) INTO result;
    
    -- Log the result
    RAISE NOTICE 'Welcome email trigger result: %', result;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Execute the comprehensive active test
SELECT test_submission_triggers() as test_result;