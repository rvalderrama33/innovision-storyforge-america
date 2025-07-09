-- Add pinned field to submissions table for top featured story positioning
ALTER TABLE public.submissions 
ADD COLUMN pinned boolean DEFAULT false;

-- Create index for better performance when querying pinned articles
CREATE INDEX idx_submissions_pinned_featured ON public.submissions(pinned, featured, created_at) WHERE status = 'approved';