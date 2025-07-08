-- Add source_links column to submissions table for admin manual submissions
ALTER TABLE public.submissions 
ADD COLUMN source_links TEXT[];

-- Add is_manual_submission column to track admin-created articles
ALTER TABLE public.submissions 
ADD COLUMN is_manual_submission BOOLEAN DEFAULT false;