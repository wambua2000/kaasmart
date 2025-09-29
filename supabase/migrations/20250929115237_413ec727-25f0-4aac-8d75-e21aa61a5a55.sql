-- Enable realtime for rooms table to sync tenant profile updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Enable replica identity for complete row data during updates  
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

-- Add RLS policies to allow managers and owners to update tenant profiles
CREATE POLICY "Managers can update tenant profiles for managed properties"
ON public.rooms
FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'manager'::app_role 
  AND EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = rooms.property_id
  )
);

CREATE POLICY "Property owners can update tenant profiles"
ON public.rooms  
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = rooms.property_id 
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Tenants can update their own profile"
ON public.rooms
FOR UPDATE  
USING (tenant_id = auth.uid());