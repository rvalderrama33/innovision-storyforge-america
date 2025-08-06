-- Add vendor role to the admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('887a9460-f692-4840-9928-9a3edc53ce9d', 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;