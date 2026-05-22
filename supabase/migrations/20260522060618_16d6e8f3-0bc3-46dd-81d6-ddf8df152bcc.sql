
-- =========================================================
-- 1) Lock manager_properties / agent_properties to OWNERS
-- =========================================================
DROP POLICY IF EXISTS "Owners can create manager assignments" ON public.manager_properties;
DROP POLICY IF EXISTS "Owners can update manager assignments" ON public.manager_properties;
DROP POLICY IF EXISTS "Owners can delete manager assignments" ON public.manager_properties;

CREATE POLICY "Owners can create manager assignments"
ON public.manager_properties
FOR INSERT TO authenticated
WITH CHECK (
  public.is_developer(auth.uid())
  OR (
    property_id IS NOT NULL
    AND property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Owners can update manager assignments"
ON public.manager_properties
FOR UPDATE TO authenticated
USING (
  public.is_developer(auth.uid())
  OR (
    property_id IS NOT NULL
    AND property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Owners can delete manager assignments"
ON public.manager_properties
FOR DELETE TO authenticated
USING (
  public.is_developer(auth.uid())
  OR (
    property_id IS NOT NULL
    AND property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Owners can create agent assignments" ON public.agent_properties;
DROP POLICY IF EXISTS "Owners can update agent assignments" ON public.agent_properties;
DROP POLICY IF EXISTS "Owners can delete agent assignments" ON public.agent_properties;

CREATE POLICY "Owners can create agent assignments"
ON public.agent_properties
FOR INSERT TO authenticated
WITH CHECK (
  public.is_developer(auth.uid())
  OR (
    property_id IS NOT NULL
    AND property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Owners can update agent assignments"
ON public.agent_properties
FOR UPDATE TO authenticated
USING (
  public.is_developer(auth.uid())
  OR (
    property_id IS NOT NULL
    AND property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  )
);

CREATE POLICY "Owners can delete agent assignments"
ON public.agent_properties
FOR DELETE TO authenticated
USING (
  public.is_developer(auth.uid())
  OR (
    property_id IS NOT NULL
    AND property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
  )
);

-- =========================================================
-- 2) Tighten invitations SELECT (hide temp passwords from invitee)
-- =========================================================
DROP POLICY IF EXISTS "Users can view relevant invitations" ON public.invitations;

CREATE POLICY "Inviters and developers can view invitations"
ON public.invitations
FOR SELECT TO authenticated
USING (
  invited_by = auth.uid()
  OR public.is_developer(auth.uid())
);

-- =========================================================
-- 3) Tighten password_reset_requests SELECT
-- =========================================================
DROP POLICY IF EXISTS "Developers and owners can view reset requests" ON public.password_reset_requests;

CREATE POLICY "Developers and inviting owners can view reset requests"
ON public.password_reset_requests
FOR SELECT TO authenticated
USING (
  public.is_developer(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.email = password_reset_requests.email
      AND i.invited_by = auth.uid()
  )
);

-- =========================================================
-- 4) free_account_signups: explicit developer-only SELECT
-- =========================================================
CREATE POLICY "Developers can read free signups"
ON public.free_account_signups
FOR SELECT TO authenticated
USING (public.is_developer(auth.uid()));

-- =========================================================
-- 5) Revoke EXECUTE from anon on internal helper functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.generate_invitation_credentials(text, text, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_rooms_for_property(uuid, text, integer, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_accessible_property_ids(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_agent_properties_with_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_manager_properties_with_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_developer(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_property(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_property_as_agent(uuid, uuid) FROM anon, public;

-- =========================================================
-- 6) Remove password_reset_requests from realtime publication
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'password_reset_requests'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.password_reset_requests';
  END IF;
END $$;
