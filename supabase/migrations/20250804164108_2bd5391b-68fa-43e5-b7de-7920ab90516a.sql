-- Create marketplace products table
CREATE TABLE public.marketplace_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, inactive, sold
  images TEXT[], -- Array of image URLs
  slug TEXT UNIQUE,
  featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  shipping_info JSONB,
  specifications JSONB,
  tags TEXT[]
);

-- Create marketplace orders table
CREATE TABLE public.marketplace_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL, -- Total in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  shipping_address JSONB,
  tracking_number TEXT,
  payment_intent_id TEXT,
  notes TEXT
);

-- Create marketplace reviews table
CREATE TABLE public.marketplace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  images TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_products
CREATE POLICY "Anyone can view active products" 
ON public.marketplace_products 
FOR SELECT 
USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can manage their own products" 
ON public.marketplace_products 
FOR ALL 
USING (auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create products" 
ON public.marketplace_products 
FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

-- RLS Policies for marketplace_orders
CREATE POLICY "Users can view their own orders" 
ON public.marketplace_orders 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create orders" 
ON public.marketplace_orders 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Vendors and buyers can update orders" 
ON public.marketplace_orders 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for marketplace_reviews
CREATE POLICY "Anyone can view reviews" 
ON public.marketplace_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON public.marketplace_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" 
ON public.marketplace_reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_reviews_updated_at
  BEFORE UPDATE ON public.marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_marketplace_products_vendor_id ON public.marketplace_products(vendor_id);
CREATE INDEX idx_marketplace_products_status ON public.marketplace_products(status);
CREATE INDEX idx_marketplace_products_category ON public.marketplace_products(category);
CREATE INDEX idx_marketplace_products_slug ON public.marketplace_products(slug);
CREATE INDEX idx_marketplace_orders_buyer_id ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_vendor_id ON public.marketplace_orders(vendor_id);
CREATE INDEX idx_marketplace_orders_product_id ON public.marketplace_orders(product_id);
CREATE INDEX idx_marketplace_reviews_product_id ON public.marketplace_reviews(product_id);