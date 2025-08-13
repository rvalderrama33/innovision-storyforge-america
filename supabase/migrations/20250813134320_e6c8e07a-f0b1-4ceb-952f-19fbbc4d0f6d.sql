-- Check if the http extension exists and create http_post function if needed
-- First ensure the http extension is available
CREATE EXTENSION IF NOT EXISTS http;

-- The http extension provides http functions, but let's make sure we have the right signature
-- The error suggests http_post(unknown, text, unknown) doesn't exist
-- Let's check what functions are available and create a proper wrapper if needed

-- Create a wrapper function that matches what our code expects
CREATE OR REPLACE FUNCTION public.http_post(uri text, content text, content_type text)
RETURNS http_response
LANGUAGE sql
AS $$
  SELECT http(('POST', uri, NULL, content_type, content)::http_request);
$$;