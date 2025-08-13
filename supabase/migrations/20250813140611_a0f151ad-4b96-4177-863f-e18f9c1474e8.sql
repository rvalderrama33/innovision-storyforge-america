-- Create the missing text-based http_post function by wrapping the character varying version
CREATE OR REPLACE FUNCTION public.http_post(uri text, content text, content_type text)
RETURNS http_response
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.http_post(uri::character varying, content::character varying, content_type::character varying);
$$;