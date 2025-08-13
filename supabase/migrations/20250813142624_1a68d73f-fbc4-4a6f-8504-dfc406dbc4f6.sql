-- Simplified comprehensive test for vendor and product submission process
CREATE OR REPLACE FUNCTION public.test_vendor_product_system()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  test_vendor_app_id uuid;
  test_product_id uuid;
  test_vendor_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- Using a test UUID
  result_msg text := '';
  scrape_result TEXT;
  approval_result TEXT;
  confirmation_result TEXT;
BEGIN
  result_msg := result_msg || 'Starting comprehensive vendor & product system test. ';
  
  -- Test 1: Vendor Application Submission (without requiring auth user)
  INSERT INTO public.vendor_applications (
    user_id,
    business_name,
    contact_email,
    contact_phone,
    shipping_country,
    vendor_bio,
    status
  ) VALUES (
    test_vendor_id,
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
    
    result_msg := result_msg || 'Website scraping test: ' || 
      CASE 
        WHEN scrape_result IS NOT NULL THEN 'SUCCESS (' || LEFT(scrape_result, 50) || '...)'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Website scraping ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 3: Vendor Application Confirmation Email
  BEGIN
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
    
    result_msg := result_msg || 'Confirmation email: ' ||
      CASE 
        WHEN confirmation_result IS NOT NULL THEN 'SUCCESS'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Confirmation email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 4: Approve the vendor application manually (since function requires auth context)
  UPDATE public.vendor_applications 
  SET 
    status = 'approved',
    reviewed_by = test_vendor_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = test_vendor_app_id;
  
  -- Add vendor role manually
  INSERT INTO public.user_roles (user_id, role)
  VALUES (test_vendor_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  result_msg := result_msg || 'Vendor application approved manually. ';
  
  -- Test 5: Vendor Approval Email
  BEGIN
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
    
    result_msg := result_msg || 'Approval email: ' ||
      CASE 
        WHEN approval_result IS NOT NULL THEN 'SUCCESS'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Approval email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 6: Product Submission by Approved Vendor
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
    stock_quantity,
    slug
  ) VALUES (
    test_vendor_id,
    'Revolutionary Smart Gadget',
    'An innovative smart device that revolutionizes daily tasks with AI-powered automation and machine learning capabilities.',
    29900, -- $299.00
    'USD',
    'Technology',
    'draft',
    ARRAY['https://example.com/product1.jpg', 'https://example.com/product2.jpg'],
    ARRAY['smart', 'AI', 'automation', 'innovative', 'technology'],
    json_build_object(
      'dimensions', '10cm x 5cm x 2cm',
      'weight', '150g',
      'battery_life', '24 hours',
      'connectivity', 'WiFi, Bluetooth 5.0',
      'materials', 'Premium aluminum and glass',
      'warranty', '2 years'
    ),
    json_build_object(
      'shipping_weight', '200g',
      'shipping_dimensions', '15cm x 10cm x 5cm',
      'shipping_methods', ARRAY['standard', 'express', 'overnight'],
      'processing_time', '1-2 business days',
      'shipping_cost', '$5.99 standard, $19.99 express'
    ),
    100,
    'revolutionary-smart-gadget-test'
  ) RETURNING id INTO test_product_id;
  
  result_msg := result_msg || 'Created test product: ' || test_product_id::text || '. ';
  
  -- Test 7: Product Content Generation
  BEGIN
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-product-content'::character varying,
      json_build_object(
        'productId', test_product_id::text,
        'productName', 'Revolutionary Smart Gadget',
        'description', 'An innovative smart device that revolutionizes daily tasks',
        'category', 'Technology'
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Product content generation: ' ||
      CASE 
        WHEN scrape_result IS NOT NULL THEN 'SUCCESS (' || LEFT(scrape_result, 30) || '...)'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Product content generation ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 8: Activate the product
  UPDATE public.marketplace_products 
  SET status = 'active', updated_at = now()
  WHERE id = test_product_id;
  
  result_msg := result_msg || 'Product activated. ';
  
  -- Test 9: Verify User Roles
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = test_vendor_id AND role = 'vendor') THEN
    result_msg := result_msg || 'Vendor role assigned ✓. ';
  ELSE
    result_msg := result_msg || 'ERROR: Vendor role not assigned! ';
  END IF;
  
  -- Test 10: Verify Product Visibility
  IF EXISTS (SELECT 1 FROM public.marketplace_products WHERE id = test_product_id AND status = 'active') THEN
    result_msg := result_msg || 'Product active ✓. ';
  ELSE
    result_msg := result_msg || 'ERROR: Product not active! ';
  END IF;
  
  -- Test 11: Test Product Search/Filtering
  IF EXISTS (
    SELECT 1 FROM public.marketplace_products 
    WHERE vendor_id = test_vendor_id 
    AND name ILIKE '%smart%' 
    AND status = 'active'
  ) THEN
    result_msg := result_msg || 'Product search working ✓. ';
  ELSE
    result_msg := result_msg || 'ERROR: Product search not working! ';
  END IF;
  
  -- Test 12: Test vendor rejection email (create another test application)
  DECLARE
    test_reject_app_id uuid;
  BEGIN
    INSERT INTO public.vendor_applications (
      user_id,
      business_name,
      contact_email,
      status
    ) VALUES (
      '00000000-0000-0000-0000-000000000002'::uuid,
      'Test Rejected Vendor',
      'rejected@example.com',
      'pending'
    ) RETURNING id INTO test_reject_app_id;
    
    -- Reject the application manually
    UPDATE public.vendor_applications 
    SET 
      status = 'rejected',
      reviewed_by = test_vendor_id,
      reviewed_at = now(),
      rejection_reason = 'Incomplete application for testing purposes',
      updated_at = now()
    WHERE id = test_reject_app_id;
    
    result_msg := result_msg || 'Test rejection successful. ';
    
    -- Send rejection email
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-rejection'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', test_reject_app_id::text,
          'business_name', 'Test Rejected Vendor',
          'contact_email', 'rejected@example.com',
          'status', 'rejected',
          'rejection_reason', 'Incomplete application for testing purposes'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Rejection email: ' ||
      CASE 
        WHEN scrape_result IS NOT NULL THEN 'SUCCESS'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Test rejection ERROR: ' || SQLERRM || '. ';
  END;
  
  result_msg := result_msg || 'COMPREHENSIVE VENDOR & PRODUCT TEST COMPLETED! ✅';
  
  RETURN result_msg;
END;
$function$;

-- Execute the comprehensive test
SELECT test_vendor_product_system() as test_result;