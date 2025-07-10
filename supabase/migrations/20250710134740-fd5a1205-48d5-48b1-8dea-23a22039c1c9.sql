-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for email template customizations
CREATE TABLE public.email_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color TEXT NOT NULL DEFAULT '#667eea',
  accent_color TEXT NOT NULL DEFAULT '#764ba2',
  company_name TEXT NOT NULL DEFAULT 'America Innovates',
  logo_url TEXT,
  footer_text TEXT NOT NULL DEFAULT 'America Innovates Magazine - Celebrating Innovation and Entrepreneurship',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_customizations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email customizations
CREATE POLICY "Admins can manage email customizations" 
ON public.email_customizations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view email customizations (for public emails)
CREATE POLICY "Anyone can view email customizations" 
ON public.email_customizations 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_customizations_updated_at
BEFORE UPDATE ON public.email_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default customizations
INSERT INTO public.email_customizations (primary_color, accent_color, company_name, footer_text)
VALUES ('#667eea', '#764ba2', 'America Innovates', 'America Innovates Magazine - Celebrating Innovation and Entrepreneurship');