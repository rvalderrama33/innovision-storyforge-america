-- Add affiliate product support to marketplace_products table
ALTER TABLE marketplace_products
ADD COLUMN is_affiliate BOOLEAN DEFAULT false;

ALTER TABLE marketplace_products
ADD COLUMN affiliate_url TEXT;

-- Create affiliate clicks tracking table
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on affiliate_clicks
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_clicks
CREATE POLICY "Anyone can insert affiliate clicks" 
ON affiliate_clicks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view affiliate clicks" 
ON affiliate_clicks 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));