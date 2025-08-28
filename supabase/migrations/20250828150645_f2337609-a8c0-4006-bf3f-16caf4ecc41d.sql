-- Ensure marketplace is live
INSERT INTO public.site_config (key, value, description)
VALUES ('marketplace_live', true, 'Controls whether the marketplace is publicly accessible')
ON CONFLICT (key) 
DO UPDATE SET 
  value = true,
  updated_at = now();