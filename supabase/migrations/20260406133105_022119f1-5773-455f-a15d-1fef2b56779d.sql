
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- SELECT: sender, receiver, OR property hierarchy member
CREATE POLICY "Users can view relevant messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );

-- INSERT: sender must be the authenticated user
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- UPDATE: sender, receiver, or property hierarchy member (for mark as read, etc.)
CREATE POLICY "Users can update relevant messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR property_id IN (SELECT public.get_accessible_property_ids(auth.uid()))
    OR public.is_developer(auth.uid())
  );
