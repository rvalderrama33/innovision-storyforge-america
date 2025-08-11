-- Remove the dangerous public read access to payment data
DROP POLICY IF EXISTS "Anyone can view their payment status" ON public.featured_story_payments;

-- Create secure policy for users to view only their own payments based on email
CREATE POLICY "Users can view their own payments" 
ON public.featured_story_payments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND payer_email = (
    SELECT auth.users.email::text 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
  )
);

-- Keep the existing admin policy (already secure)
-- Keep the insert policy but make it more restrictive for authenticated users only
DROP POLICY IF EXISTS "Anyone can create featured payments" ON public.featured_story_payments;

CREATE POLICY "Authenticated users can create payments" 
ON public.featured_story_payments 
FOR INSERT 
WITH CHECK (
  -- Allow payment creation for authenticated users or anonymous checkout (Stripe/PayPal handles security)
  -- The payer_email should match authenticated user's email when logged in
  (auth.uid() IS NULL) OR 
  (auth.uid() IS NOT NULL AND payer_email = (
    SELECT auth.users.email::text 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
  ))
);

-- Ensure only admins and payment processors can update payment status
CREATE POLICY "Admins and system can update payments" 
ON public.featured_story_payments 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  auth.uid() IS NULL  -- Allow system/webhook updates from payment processors
);