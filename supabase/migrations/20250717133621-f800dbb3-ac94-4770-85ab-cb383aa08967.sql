
-- Create table to track draft follow-up emails
CREATE TABLE public.draft_follow_up_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Reference to the draft submission
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  
  -- Email tracking
  email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate emails for the same submission within 24 hours
  UNIQUE(submission_id, email, DATE(sent_at))
);

-- Enable RLS
ALTER TABLE public.draft_follow_up_emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage draft follow-up emails" 
ON public.draft_follow_up_emails 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient lookups
CREATE INDEX idx_draft_follow_up_emails_submission ON public.draft_follow_up_emails(submission_id);
CREATE INDEX idx_draft_follow_up_emails_sent_at ON public.draft_follow_up_emails(sent_at);

-- Create function to send draft follow-up emails
CREATE OR REPLACE FUNCTION public.send_draft_follow_up_emails()
RETURNS TEXT AS $$
DECLARE
  draft_submission RECORD;
  email_count INTEGER := 0;
  result TEXT;
BEGIN
  -- Find draft submissions that are at least 24 hours old and haven't received a follow-up email in the last 24 hours
  FOR draft_submission IN
    SELECT DISTINCT s.id, s.email, s.full_name, s.product_name, s.created_at
    FROM public.submissions s
    WHERE s.status = 'draft'
      AND s.email IS NOT NULL
      AND s.created_at <= now() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.draft_follow_up_emails dfe
        WHERE dfe.submission_id = s.id
          AND dfe.email = s.email
          AND dfe.sent_at >= now() - INTERVAL '24 hours'
      )
  LOOP
    -- Send the follow-up email via edge function
    SELECT net.http_post(
      url := 'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY2t6YnhpZmRyaWhuZmNxYWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAzNzE3NywiZXhwIjoyMDY2NjEzMTc3fQ.gGe9dVXyQ1VH5wKRWJ7ZLSdUQ4qgn_4nKDzEPQT-xbw"}'::jsonb,
      body := json_build_object(
        'type', 'draft_follow_up',
        'to', draft_submission.email,
        'name', draft_submission.full_name,
        'productName', draft_submission.product_name
      )::jsonb
    ) INTO result;
    
    -- Record that we sent the email
    INSERT INTO public.draft_follow_up_emails (submission_id, email)
    VALUES (draft_submission.id, draft_submission.email);
    
    email_count := email_count + 1;
  END LOOP;
  
  RETURN format('Draft follow-up emails sent: %s', email_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run every hour (it will only send emails to drafts that are 24+ hours old)
SELECT cron.schedule(
  'draft-follow-up-emails',
  '0 * * * *', -- Every hour at minute 0
  'SELECT public.send_draft_follow_up_emails();'
);
