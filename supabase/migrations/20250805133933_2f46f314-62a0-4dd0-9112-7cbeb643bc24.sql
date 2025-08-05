-- Create site_config table for feature flags
CREATE TABLE public.site_config (
  key TEXT PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert marketplace live flag
INSERT INTO public.site_config (key, value) 
VALUES ('marketplace_live', false);

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Create marketplace_orders table
CREATE TABLE public.marketplace_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL, -- Price in cents per unit
  total_amount INTEGER NOT NULL, -- Total price in cents (price * quantity)
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.order_status NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  shipping_address JSONB,
  payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor payouts table
CREATE TABLE public.vendor_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_sales INTEGER NOT NULL DEFAULT 0, -- Total sales in cents
  commission_amount INTEGER NOT NULL DEFAULT 0, -- Platform commission in cents (20%)
  net_payout INTEGER NOT NULL DEFAULT 0, -- Vendor receives 80%
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_config
CREATE POLICY "Admins can manage site config" 
ON public.site_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view site config" 
ON public.site_config 
FOR SELECT 
USING (true);

-- RLS Policies for marketplace_orders
CREATE POLICY "Users can create orders" 
ON public.marketplace_orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own orders" 
ON public.marketplace_orders 
FOR SELECT 
USING (
  auth.uid() = buyer_id OR 
  auth.uid() = vendor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Vendors and buyers can update orders" 
ON public.marketplace_orders 
FOR UPDATE 
USING (
  auth.uid() = buyer_id OR 
  auth.uid() = vendor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for vendor_payouts
CREATE POLICY "Vendors can view their payouts" 
ON public.vendor_payouts 
FOR SELECT 
USING (
  auth.uid() = vendor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage payouts" 
ON public.vendor_payouts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for marketplace_orders
CREATE TRIGGER update_marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for site_config
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for vendor_payouts
CREATE TRIGGER update_vendor_payouts_updated_at
  BEFORE UPDATE ON public.vendor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_marketplace_orders_buyer_id ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_vendor_id ON public.marketplace_orders(vendor_id);
CREATE INDEX idx_marketplace_orders_product_id ON public.marketplace_orders(product_id);
CREATE INDEX idx_marketplace_orders_status ON public.marketplace_orders(status);
CREATE INDEX idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);