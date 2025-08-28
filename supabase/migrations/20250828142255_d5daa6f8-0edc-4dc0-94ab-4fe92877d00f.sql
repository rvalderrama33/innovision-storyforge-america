-- Fix security issues by setting search_path for functions
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN 'ORDER-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

-- Fix the create_order_with_items function with proper search_path
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_buyer_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_shipping_address JSONB,
  p_payment_intent_id TEXT,
  p_cart_items JSONB
) RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product RECORD;
  v_total_amount INTEGER := 0;
BEGIN
  -- Generate unique order number
  LOOP
    v_order_number := 'ORDER-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
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
$$;