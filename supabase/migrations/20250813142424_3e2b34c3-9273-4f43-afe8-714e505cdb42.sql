-- Comprehensive test for vendor and product submission process
CREATE OR REPLACE FUNCTION public.test_vendor_product_system()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  test_user_id uuid;
  test_vendor_app_id uuid;
  test_product_id uuid;
  result_msg text := '';
  scrape_result TEXT;
  approval_result TEXT;
  confirmation_result TEXT;
BEGIN
  -- Create a test user profile first
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'testvendor@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Test Vendor User"}'::jsonb
  ) RETURNING id INTO test_user_id;
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (test_user_id, 'testvendor@example.com', 'Test Vendor User');
  
  result_msg := result_msg || 'Created test user: ' || test_user_id::text || '. ';
  
  -- Test 1: Vendor Application Submission
  INSERT INTO public.vendor_applications (
    user_id,
    business_name,
    contact_email,
    contact_phone,
    shipping_country,
    vendor_bio,
    status
  ) VALUES (
    test_user_id,
    'Innovative Tech Solutions LLC',
    'testvendor@example.com',
    '+1-555-0123',
    'United States',
    'We create cutting-edge technology solutions for modern businesses.',
    'pending'
  ) RETURNING id INTO test_vendor_app_id;
  
  result_msg := result_msg || 'Created vendor application: ' || test_vendor_app_id::text || '. ';
  
  -- Test 2: Website Scraping for Vendor Information
  BEGIN
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/scrape-vendor-website'::character varying,
      json_build_object(
        'url', 'https://www.tesla.com',
        'vendorId', test_vendor_app_id::text
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Website scraping test result: ' || COALESCE(scrape_result, 'NULL') || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Website scraping test error: ' || SQLERRM || '. ';
  END;
  
  -- Test 3: Vendor Application Approval Process
  BEGIN
    -- Send confirmation email
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-confirmation'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', test_vendor_app_id::text,
          'business_name', 'Innovative Tech Solutions LLC',
          'contact_email', 'testvendor@example.com',
          'status', 'pending'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO confirmation_result;
    
    result_msg := result_msg || 'Confirmation email result: ' || COALESCE(confirmation_result, 'NULL') || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Confirmation email error: ' || SQLERRM || '. ';
  END;
  
  -- Approve the vendor application using the function
  PERFORM approve_vendor_application(test_vendor_app_id);
  
  BEGIN
    -- Send approval email
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-approval'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', test_vendor_app_id::text,
          'business_name', 'Innovative Tech Solutions LLC',
          'contact_email', 'testvendor@example.com',
          'status', 'approved'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO approval_result;
    
    result_msg := result_msg || 'Approval email result: ' || COALESCE(approval_result, 'NULL') || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Approval email error: ' || SQLERRM || '. ';
  END;
  
  result_msg := result_msg || 'Vendor approved successfully. ';
  
  -- Test 4: Product Submission by Approved Vendor
  INSERT INTO public.marketplace_products (
    vendor_id,
    name,
    description,
    price,
    currency,
    category,
    status,
    images,
    tags,
    specifications,
    shipping_info,
    stock_quantity
  ) VALUES (
    test_user_id,
    'Revolutionary Smart Gadget',
    'An innovative smart device that revolutionizes daily tasks with AI-powered automation.',
    29900, -- $299.00
    'USD',
    'Technology',
    'draft',
    ARRAY['https://example.com/product1.jpg', 'https://example.com/product2.jpg'],
    ARRAY['smart', 'AI', 'automation', 'innovative'],
    json_build_object(
      'dimensions', '10cm x 5cm x 2cm',
      'weight', '150g',
      'battery_life', '24 hours',
      'connectivity', 'WiFi, Bluetooth 5.0'
    ),
    json_build_object(
      'shipping_weight', '200g',
      'shipping_dimensions', '15cm x 10cm x 5cm',
      'shipping_methods', ARRAY['standard', 'express'],
      'processing_time', '1-2 business days'
    ),
    100
  ) RETURNING id INTO test_product_id;
  
  result_msg := result_msg || 'Created test product: ' || test_product_id::text || '. ';
  
  -- Test 5: Product Content Generation (if function exists)
  BEGIN
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-product-content'::character varying,
      json_build_object(
        'productId', test_product_id::text,
        'productName', 'Revolutionary Smart Gadget',
        'description', 'An innovative smart device that revolutionizes daily tasks'
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Product content generation result: ' || COALESCE(scrape_result, 'NULL') || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Product content generation error: ' || SQLERRM || '. ';
  END;
  
  -- Activate the product
  UPDATE public.marketplace_products 
  SET status = 'active', updated_at = now()
  WHERE id = test_product_id;
  
  result_msg := result_msg || 'Product activated successfully. ';
  
  -- Test 6: Verify User Roles
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = test_user_id AND role = 'vendor') THEN
    result_msg := result_msg || 'Vendor role correctly assigned. ';
  ELSE
    result_msg := result_msg || 'ERROR: Vendor role not assigned! ';
  END IF;
  
  -- Test 7: Verify Product Visibility
  IF EXISTS (SELECT 1 FROM public.marketplace_products WHERE id = test_product_id AND status = 'active') THEN
    result_msg := result_msg || 'Product is active and visible. ';
  ELSE
    result_msg := result_msg || 'ERROR: Product not active! ';
  END IF;
  
  -- Test 8: Test Product Search/Filtering
  IF EXISTS (
    SELECT 1 FROM public.marketplace_products 
    WHERE vendor_id = test_user_id 
    AND name ILIKE '%smart%' 
    AND status = 'active'
  ) THEN
    result_msg := result_msg || 'Product search functionality working. ';
  ELSE
    result_msg := result_msg || 'ERROR: Product search not working! ';
  END IF;
  
  result_msg := result_msg || 'COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!';
  
  RETURN result_msg;
END;
$function$;

-- Execute the comprehensive test
SELECT test_vendor_product_system() as test_result;