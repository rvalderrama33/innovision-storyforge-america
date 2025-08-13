-- Create and execute the comprehensive test function
CREATE OR REPLACE FUNCTION public.test_submission_triggers()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  test_submission_id uuid;
  result_msg text;
BEGIN
  -- Insert a test submission (this should trigger send_new_submission_notification)
  INSERT INTO public.submissions (
    full_name,
    email,
    product_name,
    description,
    category,
    status,
    is_manual_submission
  ) VALUES (
    'Active Test User Runtime',
    'runtimetest@example.com',
    'Test Innovation Product Runtime',
    'This is a comprehensive active test of the submission system and all triggers',
    'technology',
    'pending',
    true
  ) RETURNING id INTO test_submission_id;
  
  result_msg := 'Test submission created with ID: ' || test_submission_id::text;
  
  -- Wait a moment for the trigger to complete
  PERFORM pg_sleep(1);
  
  -- Now test the approval trigger by updating status
  UPDATE public.submissions 
  SET status = 'approved', approved_at = now()
  WHERE id = test_submission_id;
  
  result_msg := result_msg || '. Updated to approved status to test approval trigger.';
  
  RETURN result_msg;
END;
$$;