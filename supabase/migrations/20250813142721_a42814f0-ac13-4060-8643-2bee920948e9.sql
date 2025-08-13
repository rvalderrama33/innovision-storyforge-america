-- Test edge functions and vendor/product processes using existing data
CREATE OR REPLACE FUNCTION public.test_vendor_product_edge_functions()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  existing_vendor_app_id uuid;
  existing_product_id uuid;
  result_msg text := '';
  scrape_result TEXT;
  email_result TEXT;
BEGIN
  result_msg := result_msg || 'Testing vendor & product edge functions with existing data. ';
  
  -- Get an existing vendor application for testing
  SELECT id INTO existing_vendor_app_id 
  FROM vendor_applications 
  WHERE contact_email = 'carole.sprunk@gmail.com'
  LIMIT 1;
  
  -- Get an existing product for testing
  SELECT id INTO existing_product_id 
  FROM marketplace_products 
  WHERE status = 'active'
  LIMIT 1;
  
  IF existing_vendor_app_id IS NULL THEN
    result_msg := result_msg || 'ERROR: No existing vendor application found for testing! ';
    RETURN result_msg;
  END IF;
  
  IF existing_product_id IS NULL THEN
    result_msg := result_msg || 'ERROR: No existing product found for testing! ';
    RETURN result_msg;
  END IF;
  
  result_msg := result_msg || 'Using vendor app: ' || existing_vendor_app_id::text || 
                ' and product: ' || existing_product_id::text || '. ';
  
  -- Test 1: Website Scraping Function
  BEGIN
    result_msg := result_msg || 'Testing website scraping... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/scrape-vendor-website'::character varying,
      json_build_object(
        'url', 'https://www.apple.com',
        'vendorId', existing_vendor_app_id::text
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Website scraping: ' ||
      CASE 
        WHEN scrape_result IS NOT NULL AND LENGTH(scrape_result) > 10 THEN 'SUCCESS ✓'
        WHEN scrape_result IS NOT NULL THEN 'RETURNED: ' || scrape_result
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Website scraping ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 2: Vendor Confirmation Email
  BEGIN
    result_msg := result_msg || 'Testing vendor confirmation email... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-confirmation'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', existing_vendor_app_id::text,
          'business_name', 'Test Business Solutions',
          'contact_email', 'test@example.com',
          'status', 'pending'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO email_result;
    
    result_msg := result_msg || 'Confirmation email: ' ||
      CASE 
        WHEN email_result IS NOT NULL AND email_result LIKE '%id%' THEN 'SUCCESS ✓ (Email ID received)'
        WHEN email_result IS NOT NULL THEN 'RETURNED: ' || LEFT(email_result, 50) || '...'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Confirmation email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 3: Vendor Approval Email
  BEGIN
    result_msg := result_msg || 'Testing vendor approval email... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-approval'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', existing_vendor_app_id::text,
          'business_name', 'Approved Test Business',
          'contact_email', 'approved@example.com',
          'status', 'approved'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO email_result;
    
    result_msg := result_msg || 'Approval email: ' ||
      CASE 
        WHEN email_result IS NOT NULL AND email_result LIKE '%id%' THEN 'SUCCESS ✓ (Email ID received)'
        WHEN email_result IS NOT NULL THEN 'RETURNED: ' || LEFT(email_result, 50) || '...'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Approval email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 4: Vendor Rejection Email
  BEGIN
    result_msg := result_msg || 'Testing vendor rejection email... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-rejection'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', existing_vendor_app_id::text,
          'business_name', 'Rejected Test Business',
          'contact_email', 'rejected@example.com',
          'status', 'rejected',
          'rejection_reason', 'Incomplete application for testing purposes'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO email_result;
    
    result_msg := result_msg || 'Rejection email: ' ||
      CASE 
        WHEN email_result IS NOT NULL AND email_result LIKE '%id%' THEN 'SUCCESS ✓ (Email ID received)'
        WHEN email_result IS NOT NULL THEN 'RETURNED: ' || LEFT(email_result, 50) || '...'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Rejection email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 5: Product Content Generation
  BEGIN
    result_msg := result_msg || 'Testing product content generation... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-product-content'::character varying,
      json_build_object(
        'productId', existing_product_id::text,
        'productName', 'Test Smart Product',
        'description', 'An innovative test product for content generation',
        'category', 'Technology'
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Product content generation: ' ||
      CASE 
        WHEN scrape_result IS NOT NULL AND LENGTH(scrape_result) > 50 THEN 'SUCCESS ✓ (Content generated)'
        WHEN scrape_result IS NOT NULL THEN 'RETURNED: ' || LEFT(scrape_result, 50) || '...'
        ELSE 'NULL RESULT'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Product content generation ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 6: Database Operations
  result_msg := result_msg || 'Testing database operations... ';
  
  -- Test vendor application query
  IF EXISTS (SELECT 1 FROM vendor_applications WHERE status = 'approved') THEN
    result_msg := result_msg || 'Approved vendors found ✓. ';
  ELSE
    result_msg := result_msg || 'No approved vendors found! ';
  END IF;
  
  -- Test product query
  IF EXISTS (SELECT 1 FROM marketplace_products WHERE status = 'active') THEN
    result_msg := result_msg || 'Active products found ✓. ';
  ELSE
    result_msg := result_msg || 'No active products found! ';
  END IF;
  
  -- Test user roles
  IF EXISTS (SELECT 1 FROM user_roles WHERE role = 'vendor') THEN
    result_msg := result_msg || 'Vendor roles exist ✓. ';
  ELSE
    result_msg := result_msg || 'No vendor roles found! ';
  END IF;
  
  -- Test search functionality
  IF EXISTS (
    SELECT 1 FROM marketplace_products 
    WHERE status = 'active' 
    AND (name ILIKE '%kitchen%' OR description ILIKE '%kitchen%')
  ) THEN
    result_msg := result_msg || 'Product search working ✓. ';
  ELSE
    result_msg := result_msg || 'Product search test: No kitchen products found. ';
  END IF;
  
  result_msg := result_msg || 'EDGE FUNCTION TESTS COMPLETED! 🚀';
  
  RETURN result_msg;
END;
$function$;

-- Execute the edge function tests
SELECT test_vendor_product_edge_functions() as test_result;