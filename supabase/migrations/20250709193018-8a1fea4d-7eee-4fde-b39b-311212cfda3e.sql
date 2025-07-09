-- Add recommendations column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN recommendations JSONB DEFAULT '[]'::jsonb;