-- Fix RLS policies for properties table to allow authenticated users to insert their own properties
DROP POLICY IF EXISTS "Owners can manage their properties" ON public.properties;

CREATE POLICY "Owners can insert their own properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own properties"
ON public.properties
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can view their own properties"
ON public.properties
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR get_user_role(auth.uid()) = ANY (ARRAY['owner'::app_role, 'manager'::app_role, 'developer'::app_role]));

-- Fix lease_documents RLS to allow property owners to view all documents
DROP POLICY IF EXISTS "Property owners can view all lease documents" ON public.lease_documents;

CREATE POLICY "Property owners can view lease documents for their properties"
ON public.lease_documents
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'owner'::app_role 
  OR tenant_id = auth.uid()
  OR (
    get_user_role(auth.uid()) = 'manager'::app_role 
    AND EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = lease_documents.property_id
    )
  )
);

CREATE POLICY "Property owners can update lease document status"
ON public.lease_documents
FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'owner'::app_role OR tenant_id = auth.uid());

-- Ensure rooms table has proper policies for rent updates
DROP POLICY IF EXISTS "Property owners can manage rooms" ON public.rooms;

CREATE POLICY "Property owners can manage rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = rooms.property_id 
    AND properties.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = rooms.property_id 
    AND properties.owner_id = auth.uid()
  )
);