CREATE POLICY "Tenants can view agents of their property"
ON public.agent_properties FOR SELECT TO authenticated
USING (
  (property_id IS NOT NULL AND property_id IN (SELECT r.property_id FROM public.rooms r WHERE r.tenant_id = auth.uid()))
  OR (can_manage_all = true AND owner_id IS NOT NULL AND owner_id IN (
    SELECT p.owner_id FROM public.rooms r JOIN public.properties p ON p.id = r.property_id WHERE r.tenant_id = auth.uid()
  ))
);

CREATE POLICY "Tenants can view managers of their property"
ON public.manager_properties FOR SELECT TO authenticated
USING (
  (property_id IS NOT NULL AND property_id IN (SELECT r.property_id FROM public.rooms r WHERE r.tenant_id = auth.uid()))
  OR (can_manage_all = true AND owner_id IS NOT NULL AND owner_id IN (
    SELECT p.owner_id FROM public.rooms r JOIN public.properties p ON p.id = r.property_id WHERE r.tenant_id = auth.uid()
  ))
);