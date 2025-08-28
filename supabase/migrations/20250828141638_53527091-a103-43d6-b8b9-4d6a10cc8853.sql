-- Create cart items table for temporary cart storage
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS for cart items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cart items
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
FOR ALL USING (auth.uid() = user_id);

-- Update the existing marketplace_orders table to include more fields
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS vendor_notified_at TIMESTAMPTZ;
ALTER TABLE public.marketplace_orders ADD COLUMN IF NOT EXISTS processing_deadline TIMESTAMPTZ;

-- Create order items table for storing individual products in orders
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.marketplace_products(id),
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view order items for their orders
CREATE POLICY "Users can view their order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.marketplace_orders o 
    WHERE o.id = order_id 
    AND (o.buyer_id = auth.uid() OR o.vendor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORDER-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create order with items
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_buyer_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_shipping_address JSONB,
  p_payment_intent_id TEXT,
  p_cart_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product RECORD;
  v_total_amount INTEGER := 0;
BEGIN
  -- Generate unique order number
  LOOP
    v_order_number := generate_order_number();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.marketplace_orders WHERE order_number = v_order_number);
  END LOOP;
  
  -- Calculate total amount
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    SELECT * INTO v_product FROM public.marketplace_products WHERE id = (v_item->>'product_id')::UUID;
    v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::INTEGER);
  END LOOP;
  
  -- Create the order (for now, use first product's vendor - in real system, would need to handle multiple vendors)
  SELECT * INTO v_product FROM public.marketplace_products WHERE id = (p_cart_items->0->>'product_id')::UUID;
  
  INSERT INTO public.marketplace_orders (
    id,
    order_number,
    buyer_id,
    product_id,
    vendor_id,
    quantity,
    total_amount,
    customer_email,
    customer_name,
    shipping_address,
    payment_intent_id,
    status,
    vendor_notified_at,
    processing_deadline
  ) VALUES (
    gen_random_uuid(),
    v_order_number,
    p_buyer_id,
    v_product.id,
    v_product.vendor_id,
    (p_cart_items->0->>'quantity')::INTEGER,
    v_total_amount,
    p_customer_email,
    p_customer_name,
    p_shipping_address,
    p_payment_intent_id,
    'pending',
    NOW(),
    NOW() + INTERVAL '48 hours'
  ) RETURNING id INTO v_order_id;
  
  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    SELECT * INTO v_product FROM public.marketplace_products WHERE id = (v_item->>'product_id')::UUID;
    
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      total_amount
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      (v_item->>'quantity')::INTEGER,
      v_product.price * (v_item->>'quantity')::INTEGER
    );
  END LOOP;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update cart items timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();