-- Add stripe_session_id column to featured_story_payments if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'featured_story_payments' 
                   AND column_name = 'stripe_session_id') THEN
        ALTER TABLE public.featured_story_payments 
        ADD COLUMN stripe_session_id TEXT;
        
        -- Add index for the new column
        CREATE INDEX idx_featured_payments_stripe_session ON public.featured_story_payments(stripe_session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'featured_story_payments' 
                   AND column_name = 'stripe_payment_id') THEN
        ALTER TABLE public.featured_story_payments 
        ADD COLUMN stripe_payment_id TEXT;
    END IF;
END $$;