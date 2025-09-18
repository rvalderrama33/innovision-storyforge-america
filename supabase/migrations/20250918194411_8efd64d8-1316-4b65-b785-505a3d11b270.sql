-- Add vendor role to Sara Williams
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'vendor'::app_role
FROM public.profiles p
WHERE p.email = 'sara@shopcliterature.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id AND ur.role = 'vendor'::app_role
);