-- Simple test for vendor and product edge functions
CREATE OR REPLACE FUNCTION public.test_vendor_product_functions()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_msg text := '';
  scrape_result TEXT;
  email_result TEXT;
  vendor_count int;
  product_count int;
BEGIN
  result_msg := 'COMPREHENSIVE VENDOR & PRODUCT SYSTEM TEST RESULTS: ';
  
  -- Test 1: Check existing data
  SELECT COUNT(*) INTO vendor_count FROM public.vendor_applications;
  SELECT COUNT(*) INTO product_count FROM public.marketplace_products;
  
  result_msg := result_msg || 'Found ' || vendor_count || ' vendor applications and ' || 
                product_count || ' marketplace products. ';
  
  -- Test 2: Website Scraping Function
  BEGIN
    result_msg := result_msg || 'Testing website scraping function... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/scrape-vendor-website'::character varying,
      json_build_object(
        'url', 'https://www.example.com',
        'vendorId', gen_random_uuid()::text
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Scraping result: ' ||
      CASE 
        WHEN scrape_result IS NOT NULL AND LENGTH(scrape_result) > 10 THEN 'SUCCESS ✓'
        WHEN scrape_result IS NOT NULL THEN scrape_result
        ELSE 'NO RESPONSE'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Scraping ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 3: Vendor Confirmation Email
  BEGIN
    result_msg := result_msg || 'Testing vendor confirmation email... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-confirmation'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', gen_random_uuid()::text,
          'business_name', 'Test Business Solutions',
          'contact_email', 'test@example.com',
          'status', 'pending'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO email_result;
    
    result_msg := result_msg || 'Confirmation email: ' ||
      CASE 
        WHEN email_result IS NOT NULL AND (email_result LIKE '%id%' OR email_result LIKE '%success%') THEN 'SUCCESS ✓'
        WHEN email_result IS NOT NULL THEN LEFT(email_result, 50) || '...'
        ELSE 'NO RESPONSE'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Confirmation email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 4: Vendor Approval Email
  BEGIN
    result_msg := result_msg || 'Testing vendor approval email... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-approval'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', gen_random_uuid()::text,
          'business_name', 'Approved Test Business',
          'contact_email', 'approved@example.com',
          'status', 'approved'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO email_result;
    
    result_msg := result_msg || 'Approval email: ' ||
      CASE 
        WHEN email_result IS NOT NULL AND (email_result LIKE '%id%' OR email_result LIKE '%success%') THEN 'SUCCESS ✓'
        WHEN email_result IS NOT NULL THEN LEFT(email_result, 50) || '...'
        ELSE 'NO RESPONSE'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Approval email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 5: Vendor Rejection Email
  BEGIN
    result_msg := result_msg || 'Testing vendor rejection email... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/send-vendor-rejection'::character varying,
      json_build_object(
        'application', json_build_object(
          'id', gen_random_uuid()::text,
          'business_name', 'Rejected Test Business',
          'contact_email', 'rejected@example.com',
          'status', 'rejected',
          'rejection_reason', 'Incomplete application for testing'
        )
      )::text::character varying,
      'application/json'::character varying
    )).content INTO email_result;
    
    result_msg := result_msg || 'Rejection email: ' ||
      CASE 
        WHEN email_result IS NOT NULL AND (email_result LIKE '%id%' OR email_result LIKE '%success%') THEN 'SUCCESS ✓'
        WHEN email_result IS NOT NULL THEN LEFT(email_result, 50) || '...'
        ELSE 'NO RESPONSE'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Rejection email ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 6: Product Content Generation
  BEGIN
    result_msg := result_msg || 'Testing product content generation... ';
    
    SELECT (http_post(
      'https://enckzbxifdrihnfcqagb.supabase.co/functions/v1/generate-product-content'::character varying,
      json_build_object(
        'productId', gen_random_uuid()::text,
        'productName', 'Test Smart Product',
        'description', 'An innovative test product for content generation',
        'category', 'Technology'
      )::text::character varying,
      'application/json'::character varying
    )).content INTO scrape_result;
    
    result_msg := result_msg || 'Product content: ' ||
      CASE 
        WHEN scrape_result IS NOT NULL AND LENGTH(scrape_result) > 50 THEN 'SUCCESS ✓'
        WHEN scrape_result IS NOT NULL THEN LEFT(scrape_result, 50) || '...'
        ELSE 'NO RESPONSE'
      END || '. ';
  EXCEPTION
    WHEN OTHERS THEN
      result_msg := result_msg || 'Product content ERROR: ' || SQLERRM || '. ';
  END;
  
  -- Test 7: Database Functionality Tests
  result_msg := result_msg || 'Database tests: ';
  
  -- Test vendor applications
  IF vendor_count > 0 THEN
    result_msg := result_msg || 'Vendor apps ✓ ';
  ELSE
    result_msg := result_msg || 'No vendor apps! ';
  END IF;
  
  -- Test marketplace products
  IF product_count > 0 THEN
    result_msg := result_msg || 'Products ✓ ';
  ELSE
    result_msg := result_msg || 'No products! ';
  END IF;
  
  -- Test active products
  IF EXISTS (SELECT 1 FROM public.marketplace_products WHERE status = 'active') THEN
    result_msg := result_msg || 'Active products ✓ ';
  ELSE
    result_msg := result_msg || 'No active products! ';
  END IF;
  
  -- Test vendor roles
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'vendor') THEN
    result_msg := result_msg || 'Vendor roles ✓ ';
  ELSE
    result_msg := result_msg || 'No vendor roles! ';
  END IF;
  
  result_msg := result_msg || 'TEST COMPLETED! 🎯';
  
  RETURN result_msg;
END;
$function$;

-- Execute the tests
SELECT test_vendor_product_functions() as comprehensive_test_results;