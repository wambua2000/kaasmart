-- Allow tenants to view agent assignments for their property
CREATE POLICY "Tenants can view agents for their property"
  ON public.agent_properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.rooms 
      WHERE rooms.tenant_id = auth.uid() 
        AND (
          rooms.property_id = agent_properties.property_id 
          OR agent_properties.can_manage_all = true
        )
    )
  );