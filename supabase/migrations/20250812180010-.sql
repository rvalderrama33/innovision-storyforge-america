-- Fix function search path for security compliance
CREATE OR REPLACE FUNCTION public.send_submission_approval_email()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  submission_record RECORD;
BEGIN
  -- Get the submission details
  SELECT * INTO submission_record FROM public.submissions WHERE id = NEW.id;
  
  -- Only send email if status changed to approved and we have the required data
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND submission_record.email IS NOT NULL THEN
    -- Send approval email via edge function (async)
    PERFORM pg_notify('send_approval_email', json_build_object(
      'email', submission_record.email,
      'name', submission_record.full_name,
      'productName', submission_record.product_name,
      'slug', submission_record.slug
    )::text);
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
BEGIN
  -- Send welcome email when subscriber is confirmed
  IF NEW.confirmed_at IS NOT NULL AND (OLD.confirmed_at IS NULL OR OLD.confirmed_at != NEW.confirmed_at) THEN
    PERFORM pg_notify('send_welcome_email', json_build_object(
      'email', NEW.email,
      'name', NEW.full_name
    )::text);
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
BEGIN
  -- Send admin notification for new submissions
  PERFORM pg_notify('send_admin_notification', json_build_object(
    'type', 'article_submission',
    'data', row_to_json(NEW)
  )::text);
  
  RETURN NEW;
END;
$$;