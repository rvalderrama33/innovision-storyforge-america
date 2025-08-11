-- Fix Security Definer View issue by removing the problematic view
-- and using direct table access with proper RLS policies

-- Drop the existing view that bypasses RLS
DROP VIEW IF EXISTS public.published_articles;

-- Ensure the submissions table has proper RLS policy for public read access to approved articles
-- Create policy to allow anyone to view approved submissions (published articles)
CREATE POLICY "Anyone can view approved submissions" 
ON public.submissions 
FOR SELECT 
USING (status = 'approved');