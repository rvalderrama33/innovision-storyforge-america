-- Create newsletters table
CREATE TABLE public.newsletters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  html_content text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0
);

-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  subscription_source text DEFAULT 'website',
  confirmation_token text,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create email_analytics table for tracking
CREATE TABLE public.email_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id uuid REFERENCES public.newsletters(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  event_data jsonb,
  user_agent text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create newsletter_links table for tracking clicks
CREATE TABLE public.newsletter_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id uuid REFERENCES public.newsletters(id) ON DELETE CASCADE,
  original_url text NOT NULL,
  tracking_token text NOT NULL UNIQUE,
  click_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_links ENABLE ROW LEVEL SECURITY;

-- Create policies for newsletters
CREATE POLICY "Admins can manage newsletters" 
ON public.newsletters 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published newsletters" 
ON public.newsletters 
FOR SELECT 
USING (status = 'sent');

-- Create policies for newsletter_subscribers
CREATE POLICY "Admins can manage subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert subscribers" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Subscribers can view their own data" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create policies for email_analytics
CREATE POLICY "Admins can view analytics" 
ON public.email_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert analytics events" 
ON public.email_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create policies for newsletter_links
CREATE POLICY "Admins can manage newsletter links" 
ON public.newsletter_links 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view newsletter links" 
ON public.newsletter_links 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_active ON public.newsletter_subscribers(is_active);
CREATE INDEX idx_email_analytics_newsletter_id ON public.email_analytics(newsletter_id);
CREATE INDEX idx_email_analytics_event_type ON public.email_analytics(event_type);
CREATE INDEX idx_newsletter_links_tracking_token ON public.newsletter_links(tracking_token);

-- Create triggers for updated_at
CREATE TRIGGER update_newsletters_updated_at
BEFORE UPDATE ON public.newsletters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();