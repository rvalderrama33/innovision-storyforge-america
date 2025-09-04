-- Allow admins to create submissions (fixes manual admin submission RLS error)
CREATE POLICY "Admins can create submissions"
ON public.submissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));