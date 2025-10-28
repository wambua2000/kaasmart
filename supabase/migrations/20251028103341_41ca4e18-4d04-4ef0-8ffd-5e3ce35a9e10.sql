-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Tenants can view their property details" ON public.properties;

-- Create a security definer function to check if user is a tenant of a property
CREATE OR REPLACE FUNCTION public.is_tenant_of_property(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms
    WHERE rooms.property_id = _property_id
      AND rooms.tenant_id = _user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Tenants can view their property details"
ON public.properties
FOR SELECT
TO public
USING (public.is_tenant_of_property(auth.uid(), id));