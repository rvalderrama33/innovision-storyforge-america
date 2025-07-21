-- Subscribe all existing users with email addresses to the newsletter
INSERT INTO public.newsletter_subscribers (email, full_name, subscription_source, confirmed_at, is_active)
SELECT 
  p.email,
  p.full_name,
  'user_sync' as subscription_source,
  now() as confirmed_at,
  true as is_active
FROM public.profiles p
WHERE p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.newsletter_subscribers ns 
    WHERE ns.email = p.email
  );