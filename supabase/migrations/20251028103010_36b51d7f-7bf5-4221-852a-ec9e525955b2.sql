-- Add RLS policy to allow tenants to view their property details
CREATE POLICY "Tenants can view their property details"
ON public.properties
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.rooms 
    WHERE rooms.property_id = properties.id 
      AND rooms.tenant_id = auth.uid()
  )
);