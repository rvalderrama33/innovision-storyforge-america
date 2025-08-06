-- Create function to clean up draft submissions when a user completes submission
CREATE OR REPLACE FUNCTION public.cleanup_user_drafts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only clean up drafts if the new submission is not a draft and has an email
  IF NEW.status != 'draft' AND NEW.email IS NOT NULL THEN
    -- Delete all other draft submissions for the same email
    DELETE FROM public.submissions 
    WHERE email = NEW.email 
      AND status = 'draft' 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically clean up drafts on submission completion
CREATE TRIGGER cleanup_drafts_on_completion
  AFTER INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_drafts();