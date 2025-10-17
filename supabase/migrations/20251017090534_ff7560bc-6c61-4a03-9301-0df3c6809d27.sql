-- Step 1: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role 
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Fix the recursive policy on properties table
DROP POLICY IF EXISTS "Owners can view their own properties" ON public.properties;

CREATE POLICY "Owners can view their own properties" 
ON public.properties FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- Step 3: Remove the vulnerable get_user_role_safe function
DROP FUNCTION IF EXISTS public.get_user_role_safe(uuid);

-- Verify migration
-- The user_roles table should now contain all roles from profiles