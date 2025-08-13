-- Check the available http functions and create proper wrapper
-- Let's use the correct http function signature that already exists

-- Check what's already available from the http extension
DO $$
BEGIN
  -- Let's see if we need to recreate the function with the correct signature
  -- The http extension should already provide http_post, let's check if it exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.proname = 'http_post'
    AND p.pronargs = 3
  ) THEN
    -- Create the function manually using the base http function
    -- Based on the postgres http extension, http_post should take (uri, content, content_type)
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.http_post(uri character varying, content character varying, content_type character varying)
    RETURNS http_response
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path TO ''''
    AS $func$ 
      SELECT public.http((''POST'', $1, NULL, $3, $2)::public.http_request) 
    $func$;';
  END IF;
END
$$;