-- Part 1: Fix the RLS policy on user_roles to explicitly target authenticated users
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Part 3: Ensure all profiles have corresponding entries in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role 
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;