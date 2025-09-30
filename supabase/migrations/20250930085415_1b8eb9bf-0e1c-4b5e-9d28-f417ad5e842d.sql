-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Developers can view all user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;

-- Create a security definer function that bypasses RLS to get user role
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Recreate the policies using the safe function
CREATE POLICY "Developers can view all user profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'developer'
);

CREATE POLICY "Owners can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.get_user_role_safe(auth.uid()) = 'owner'
);