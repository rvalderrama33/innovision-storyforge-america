
-- Create table to track featured story payments
CREATE TABLE public.featured_story_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Reference to the submission
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  
  -- Payment details (supports both PayPal and Stripe)
  paypal_order_id TEXT,
  paypal_payment_id TEXT,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  
  -- Payment information
  amount INTEGER NOT NULL DEFAULT 5000, -- $50.00 in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  
  -- Featured period
  featured_start_date TIMESTAMP WITH TIME ZONE,
  featured_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Customer information
  payer_email TEXT,
  payer_name TEXT
);

-- Enable RLS
ALTER TABLE public.featured_story_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage featured payments" 
ON public.featured_story_payments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can create featured payments" 
ON public.featured_story_payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their payment status" 
ON public.featured_story_payments 
FOR SELECT 
USING (true);

-- Create indexes
CREATE INDEX idx_featured_payments_submission ON public.featured_story_payments(submission_id);
CREATE INDEX idx_featured_payments_paypal_order ON public.featured_story_payments(paypal_order_id);
CREATE INDEX idx_featured_payments_stripe_session ON public.featured_story_payments(stripe_session_id);
CREATE INDEX idx_featured_payments_status ON public.featured_story_payments(status);

-- Add trigger for updated_at
CREATE TRIGGER update_featured_story_payments_updated_at
  BEFORE UPDATE ON public.featured_story_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically set featured status when payment is completed
CREATE OR REPLACE FUNCTION public.handle_featured_payment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status changed to completed, update the submission
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Set featured period dates
    NEW.featured_start_date = now();
    NEW.featured_end_date = now() + INTERVAL '30 days';
    
    -- Update the submission to be featured
    UPDATE public.submissions 
    SET featured = true, 
        updated_at = now()
    WHERE id = NEW.submission_id;
  END IF;
  
  -- If featured period has ended, remove featured status
  IF NEW.featured_end_date IS NOT NULL AND NEW.featured_end_date < now() THEN
    UPDATE public.submissions 
    SET featured = false, 
        updated_at = now()
    WHERE id = NEW.submission_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment completion
CREATE TRIGGER featured_payment_completion_trigger
  BEFORE UPDATE ON public.featured_story_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_featured_payment_completion();

-- Function to check and expire featured stories
CREATE OR REPLACE FUNCTION public.expire_featured_stories()
RETURNS TEXT AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Update submissions where featured period has ended
  UPDATE public.submissions 
  SET featured = false, 
      updated_at = now()
  WHERE id IN (
    SELECT DISTINCT fp.submission_id
    FROM public.featured_story_payments fp
    WHERE fp.status = 'completed'
      AND fp.featured_end_date < now()
      AND EXISTS (
        SELECT 1 FROM public.submissions s 
        WHERE s.id = fp.submission_id 
        AND s.featured = true
      )
  );
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN format('Expired featured stories: %s', expired_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run daily to expire featured stories
SELECT cron.schedule(
  'expire-featured-stories',
  '0 0 * * *', -- Daily at midnight
  'SELECT public.expire_featured_stories();'
);
