-- Allow users to delete their own rejected vendor applications
CREATE POLICY "Users can delete their own rejected applications"
ON public.vendor_applications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'rejected');

-- Allow admins to delete any rejected applications  
CREATE POLICY "Admins can delete rejected applications"
ON public.vendor_applications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND status = 'rejected');