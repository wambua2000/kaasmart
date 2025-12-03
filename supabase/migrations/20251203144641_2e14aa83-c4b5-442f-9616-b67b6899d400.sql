-- Drop the three problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Agents can send messages" ON public.messages;
DROP POLICY IF EXISTS "Agents can view direct messages" ON public.messages;
DROP POLICY IF EXISTS "Agents can view property messages" ON public.messages;

-- Recreate policies using has_role() function instead of querying profiles.role

-- Policy 1: Agents can send messages
CREATE POLICY "Agents can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role) 
  AND sender_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM agent_properties ap
    WHERE ap.agent_id = auth.uid() 
    AND (ap.can_manage_all = true OR ap.property_id = messages.property_id)
  )
);

-- Policy 2: Agents can view direct messages
CREATE POLICY "Agents can view direct messages"
ON public.messages FOR SELECT
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

-- Policy 3: Agents can view property messages
CREATE POLICY "Agents can view property messages"
ON public.messages FOR SELECT
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND EXISTS (
    SELECT 1 FROM agent_properties ap
    WHERE ap.agent_id = auth.uid() 
    AND (ap.can_manage_all = true OR ap.property_id = messages.property_id)
  )
);