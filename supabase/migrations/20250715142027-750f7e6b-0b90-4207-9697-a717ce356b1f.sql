-- Add the missing subscribers who signed up but weren't added to newsletter
INSERT INTO public.newsletter_subscribers (email, full_name, subscription_source, confirmed_at, is_active)
VALUES 
  ('rick@myproduct.today', 'Rick', 'manual_fix', now(), true),
  ('willkessel@yahoo.com', 'Will Kessel', 'manual_fix', now(), true)
ON CONFLICT (email) DO NOTHING;