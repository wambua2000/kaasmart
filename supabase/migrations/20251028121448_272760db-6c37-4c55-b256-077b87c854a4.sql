-- Add RLS policies to allow managers and property owners to view messages for their properties

-- Policy for managers to view messages for assigned properties
CREATE POLICY "Managers can view messages for assigned properties"
ON public.messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM manager_properties mp
    WHERE mp.manager_id = auth.uid()
    AND (
      mp.can_manage_all = true 
      OR mp.property_id = messages.property_id
    )
  )
);

-- Policy for property owners to view messages for their properties
CREATE POLICY "Property owners can view messages for their properties"
ON public.messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  AND EXISTS (
    SELECT 1 
    FROM properties p
    WHERE p.id = messages.property_id
    AND p.owner_id = auth.uid()
  )
);