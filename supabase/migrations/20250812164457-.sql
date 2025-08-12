-- Fix RLS policies for newsletter_subscribers table to allow admins to access all data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON public.newsletter_subscribers;

-- Create proper RLS policies for newsletter_subscribers
CREATE POLICY "Admins can view all newsletter subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage newsletter subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Public can subscribe to newsletter" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can manage their own subscription" 
ON public.newsletter_subscribers 
FOR ALL 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Also fix RLS policies for email_analytics table
DROP POLICY IF EXISTS "Admins can view email analytics" ON public.email_analytics;
DROP POLICY IF EXISTS "Admins can manage email analytics" ON public.email_analytics;

CREATE POLICY "Admins can view email analytics" 
ON public.email_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage email analytics" 
ON public.email_analytics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);