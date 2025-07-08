-- Add featured field to submissions table
ALTER TABLE public.submissions 
ADD COLUMN featured boolean DEFAULT false;