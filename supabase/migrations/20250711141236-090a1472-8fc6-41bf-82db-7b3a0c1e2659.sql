-- Add phone_number and selected_vendors columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN phone_number text,
ADD COLUMN selected_vendors text[] DEFAULT '{}';

-- Add index for better performance on status queries (used in reports)
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at DESC);