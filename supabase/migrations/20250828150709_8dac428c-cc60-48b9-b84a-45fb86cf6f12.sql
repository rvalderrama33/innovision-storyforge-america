-- Ensure marketplace is live
INSERT INTO public.site_config (key, value)
VALUES ('marketplace_live', true)
ON CONFLICT (key) 
DO UPDATE SET 
  value = true,
  updated_at = now();