-- Fix submissions status check constraint to allow valid status values
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add proper status constraint with all valid values
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'draft'));