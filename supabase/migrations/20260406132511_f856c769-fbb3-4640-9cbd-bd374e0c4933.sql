
-- 1. Create helper function to get all property IDs a user can access
CREATE OR REPLACE FUNCTION public.get_accessible_property_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Properties owned by user
  SELECT id FROM public.properties WHERE owner_id = _user_id
  UNION
  -- Properties assigned to user as manager
  SELECT property_id FROM public.manager_properties WHERE manager_id = _user_id AND property_id IS NOT NULL
  UNION
  -- All properties if manager has can_manage_all
  SELECT p.id FROM public.properties p
    WHERE EXISTS (SELECT 1 FROM public.manager_properties mp WHERE mp.manager_id = _user_id AND mp.can_manage_all = true)
  UNION
  -- Properties assigned to user as agent
  SELECT property_id FROM public.agent_properties WHERE agent_id = _user_id AND property_id IS NOT NULL
  UNION
  -- All properties if agent has can_manage_all
  SELECT p.id FROM public.properties p
    WHERE EXISTS (SELECT 1 FROM public.agent_properties ap WHERE ap.agent_id = _user_id AND ap.can_manage_all = true)
  UNION
  -- Property of the room the tenant is assigned to
  SELECT r.property_id FROM public.rooms r WHERE r.tenant_id = _user_id
$$;

-- Helper: check if user is a developer
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'developer'
  )
$$;

-- ============================================
-- PROPERTIES: Owner sees own, others see assigned
-- ============================================
DROP POLICY IF EXISTS "Authenticated can view properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can manage own properties" ON public.properties;

CREATE POLICY "Users can view accessible properties"
  ON public.properties FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.is_developer(auth.uid()));

CREATE POLICY "Owners can update own properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_developer(auth.uid()));

CREATE POLICY "Owners can delete own properties"
  ON public.properties FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_developer(auth.uid()));

-- ============================================
-- ROOMS: Based on property access
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated can view rooms" ON public.rooms;

CREATE POLICY "Users can view rooms in accessible properties"
  ON public.rooms FOR SELECT TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can insert rooms in accessible properties"
  ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can update rooms in accessible properties"
  ON public.rooms FOR UPDATE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can delete rooms in accessible properties"
  ON public.rooms FOR DELETE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- PAYMENTS: Based on property access
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated can view payments" ON public.payments;

CREATE POLICY "Users can view payments for accessible properties"
  ON public.payments FOR SELECT TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR tenant_id = auth.uid()
    OR recorded_by = auth.uid()
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can insert payments for accessible properties"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can update payments for accessible properties"
  ON public.payments FOR UPDATE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can delete payments for accessible properties"
  ON public.payments FOR DELETE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- PAYMENT_REMINDERS: Based on property access
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Authenticated can view reminders" ON public.payment_reminders;

CREATE POLICY "Users can view reminders for accessible properties"
  ON public.payment_reminders FOR SELECT TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR tenant_id = auth.uid()
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can insert reminders for accessible properties"
  ON public.payment_reminders FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can update reminders for accessible properties"
  ON public.payment_reminders FOR UPDATE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can delete reminders for accessible properties"
  ON public.payment_reminders FOR DELETE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- LEASE_DOCUMENTS: Based on property access
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage lease documents" ON public.lease_documents;
DROP POLICY IF EXISTS "Authenticated can view lease documents" ON public.lease_documents;

CREATE POLICY "Users can view lease docs for accessible properties"
  ON public.lease_documents FOR SELECT TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR tenant_id = auth.uid()
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can insert lease docs for accessible properties"
  ON public.lease_documents FOR INSERT TO authenticated
  WITH CHECK (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can update lease docs for accessible properties"
  ON public.lease_documents FOR UPDATE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can delete lease docs for accessible properties"
  ON public.lease_documents FOR DELETE TO authenticated
  USING (
    property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- INVITATIONS: Users see own invitations or ones for their properties
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Authenticated can view invitations" ON public.invitations;

CREATE POLICY "Users can view relevant invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid()
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can create invitations for their properties"
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can update relevant invitations"
  ON public.invitations FOR UPDATE TO authenticated
  USING (
    invited_by = auth.uid()
    OR property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Users can delete own invitations"
  ON public.invitations FOR DELETE TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- AGENT_PROPERTIES: Agents see own, owners see their properties' agents
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage agent properties" ON public.agent_properties;
DROP POLICY IF EXISTS "Authenticated can view agent properties" ON public.agent_properties;

CREATE POLICY "Users can view relevant agent assignments"
  ON public.agent_properties FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid()
    OR assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can create agent assignments"
  ON public.agent_properties FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can update agent assignments"
  ON public.agent_properties FOR UPDATE TO authenticated
  USING (
    assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can delete agent assignments"
  ON public.agent_properties FOR DELETE TO authenticated
  USING (
    assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- MANAGER_PROPERTIES: Managers see own, owners see their properties' managers
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage manager properties" ON public.manager_properties;
DROP POLICY IF EXISTS "Authenticated can view manager properties" ON public.manager_properties;

CREATE POLICY "Users can view relevant manager assignments"
  ON public.manager_properties FOR SELECT TO authenticated
  USING (
    manager_id = auth.uid()
    OR assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can create manager assignments"
  ON public.manager_properties FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can update manager assignments"
  ON public.manager_properties FOR UPDATE TO authenticated
  USING (
    assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

CREATE POLICY "Owners can delete manager assignments"
  ON public.manager_properties FOR DELETE TO authenticated
  USING (
    assigned_by = auth.uid()
    OR property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
    OR public.is_developer(auth.uid())
  );

-- ============================================
-- PASSWORD_RESET_REQUESTS: Only developers and the requester
-- ============================================
DROP POLICY IF EXISTS "Authenticated can manage reset requests" ON public.password_reset_requests;
DROP POLICY IF EXISTS "Authenticated can view reset requests" ON public.password_reset_requests;

CREATE POLICY "Developers and owners can view reset requests"
  ON public.password_reset_requests FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR public.is_developer(auth.uid())
    OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Developers and owners can manage reset requests"
  ON public.password_reset_requests FOR UPDATE TO authenticated
  USING (
    public.is_developer(auth.uid())
    OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Developers can delete reset requests"
  ON public.password_reset_requests FOR DELETE TO authenticated
  USING (public.is_developer(auth.uid()));

-- ============================================
-- PROFILES: Keep broad read (needed for messaging), restrict writes
-- ============================================
-- Keep existing policies - they're already reasonable
-- "Allow select all for authenticated" = true (needed for name lookups in messaging)
-- "Users can update own profile" = auth.uid() = id (correct)

-- ============================================
-- USER_ROLES: Restrict to own roles only (has_role function is SECURITY DEFINER so bypasses RLS)
-- ============================================
DROP POLICY IF EXISTS "Allow select all roles for authenticated" ON public.user_roles;
-- Keep "Users can view own roles" policy
