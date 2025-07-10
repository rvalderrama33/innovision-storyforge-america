-- Create functions for incrementing newsletter counters
CREATE OR REPLACE FUNCTION public.increment_newsletter_opens(newsletter_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.newsletters 
  SET open_count = open_count + 1 
  WHERE id = newsletter_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_newsletter_clicks(newsletter_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.newsletters 
  SET click_count = click_count + 1 
  WHERE id = newsletter_id;
END;
$$ LANGUAGE plpgsql;