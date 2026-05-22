
-- 1) Tighten profiles SELECT
DROP POLICY IF EXISTS "Allow select all for authenticated" ON public.profiles;

CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_developer(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.owner_id = profiles.id
      AND p.id IN (SELECT public.get_accessible_property_ids(auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.tenant_id = profiles.id
      AND r.property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM public.manager_properties mp
    WHERE mp.manager_id = profiles.id
      AND (
        mp.assigned_by = auth.uid()
        OR mp.property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.agent_properties ap
    WHERE ap.agent_id = profiles.id
      AND (
        ap.assigned_by = auth.uid()
        OR ap.property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.messages m
    WHERE (m.sender_id = profiles.id AND m.receiver_id = auth.uid())
       OR (m.receiver_id = profiles.id AND m.sender_id = auth.uid())
  )
);

-- 2) Restrict anonymous password reset insertion to only safe fields
DROP POLICY IF EXISTS "Anon can insert reset requests" ON public.password_reset_requests;

CREATE POLICY "Anon can submit reset requests"
ON public.password_reset_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  new_password IS NULL
  AND completed_at IS NULL
  AND (status IS NULL OR status = 'pending')
);
