-- Create policy to allow anonymous users to view approved submissions (for public stories)
CREATE POLICY "Anyone can view approved submissions" 
ON public.submissions 
FOR SELECT 
USING (status = 'approved');