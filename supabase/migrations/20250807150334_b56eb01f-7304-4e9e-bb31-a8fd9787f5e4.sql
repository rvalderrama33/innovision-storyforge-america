-- Add policy to allow users to assign themselves the vendor role
CREATE POLICY "Users can assign themselves vendor role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND role = 'vendor'::app_role
);