-- Set joseph@kutambua.com as developer
-- First, ensure the profile exists (in case user signs up first)
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'developer'::app_role, 'Joseph'
FROM auth.users
WHERE email = 'joseph@kutambua.com'
ON CONFLICT (id) DO UPDATE
SET role = 'developer'::app_role;

-- Also update if profile already exists
UPDATE public.profiles
SET role = 'developer'::app_role
WHERE email = 'joseph@kutambua.com';