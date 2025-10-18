-- Create security definer function to check if manager can access a property
-- This prevents infinite recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.can_manage_property(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.manager_properties mp
    WHERE mp.manager_id = _user_id
      AND (mp.can_manage_all = true OR mp.property_id = _property_id)
  )
$$;

-- Fix the manager view policy for properties to prevent infinite recursion
DROP POLICY IF EXISTS "Managers can view assigned properties" ON public.properties;

CREATE POLICY "Managers can view assigned properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND can_manage_property(auth.uid(), id)
);

-- Fix the rooms policies to prevent infinite recursion
DROP POLICY IF EXISTS "Managers can view rooms for assigned properties" ON public.rooms;

CREATE POLICY "Managers can view rooms for assigned properties"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND can_manage_property(auth.uid(), property_id)
);

DROP POLICY IF EXISTS "Managers can update rooms for assigned properties" ON public.rooms;

CREATE POLICY "Managers can update rooms for assigned properties"
ON public.rooms
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND can_manage_property(auth.uid(), property_id)
);