-- Fix the http_post function with correct parameter types
-- The error shows the function is being called with (unknown, text, unknown) types
-- We need to ensure our function signature matches exactly

-- Drop existing function and recreate with explicit types
DROP FUNCTION IF EXISTS public.http_post(text, text, text);
DROP FUNCTION IF EXISTS public.http_post(character varying, character varying, character varying);

-- Create the function with the exact signature the triggers expect
CREATE OR REPLACE FUNCTION public.http_post(uri character varying, content character varying, content_type character varying)
RETURNS http_response
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.http(('POST', uri, NULL, content_type, content)::public.http_request);
$$;

-- Also create an overload for text types just in case
CREATE OR REPLACE FUNCTION public.http_post(uri text, content text, content_type text)
RETURNS http_response
LANGUAGE sql
SECURITY DEFINER  
SET search_path TO ''
AS $$
  SELECT public.http(('POST', uri::character varying, NULL, content_type::character varying, content::character varying)::public.http_request);
$$;