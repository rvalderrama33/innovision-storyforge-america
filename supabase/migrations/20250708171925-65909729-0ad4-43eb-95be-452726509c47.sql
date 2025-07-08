-- Add DELETE policy for admins on submissions table
CREATE POLICY "Admins can delete submissions" 
  ON public.submissions 
  FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));