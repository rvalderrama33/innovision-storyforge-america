-- Create site_config table for feature flags (only if not exists)
CREATE TABLE IF NOT EXISTS public.site_config (
  key TEXT PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert marketplace live flag if not exists
INSERT INTO public.site_config (key, value) 
VALUES ('marketplace_live', false)
ON CONFLICT (key) DO NOTHING;

-- Create order status enum if not exists
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create vendor payouts table if not exists
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
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

-- Enable RLS on new tables
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_config
DROP POLICY IF EXISTS "Admins can manage site config" ON public.site_config;
CREATE POLICY "Admins can manage site config" 
ON public.site_config 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view site config" ON public.site_config;
CREATE POLICY "Anyone can view site config" 
ON public.site_config 
FOR SELECT 
USING (true);

-- RLS Policies for vendor_payouts
DROP POLICY IF EXISTS "Vendors can view their payouts" ON public.vendor_payouts;
CREATE POLICY "Vendors can view their payouts" 
ON public.vendor_payouts 
FOR SELECT 
USING (
  auth.uid() = vendor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can manage payouts" ON public.vendor_payouts;
CREATE POLICY "Admins can manage payouts" 
ON public.vendor_payouts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers if not exists
DROP TRIGGER IF EXISTS update_site_config_updated_at ON public.site_config;
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_payouts_updated_at ON public.vendor_payouts;
CREATE TRIGGER update_vendor_payouts_updated_at
  BEFORE UPDATE ON public.vendor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance if not exists
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);