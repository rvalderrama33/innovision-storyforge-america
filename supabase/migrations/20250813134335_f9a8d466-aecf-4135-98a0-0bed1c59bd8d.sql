-- Fix the search path for the http_post function to address security warning
CREATE OR REPLACE FUNCTION public.http_post(uri text, content text, content_type text)
RETURNS http_response
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT http(('POST', uri, NULL, content_type, content)::http_request);
$$;