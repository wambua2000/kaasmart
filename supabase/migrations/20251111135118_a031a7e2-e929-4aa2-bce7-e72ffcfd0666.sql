-- Drop the restrictive agent message viewing policies and create better ones
DROP POLICY IF EXISTS "Agents can view their direct messages" ON public.messages;
DROP POLICY IF EXISTS "Agents can view messages for assigned properties" ON public.messages;

-- Create a simpler policy for agents to view their direct messages
-- This checks the profiles table directly instead of relying on has_role
CREATE POLICY "Agents can view direct messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
  AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
);

-- Create policy for agents to view messages for their assigned properties
CREATE POLICY "Agents can view property messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
  AND EXISTS (
    SELECT 1 FROM public.agent_properties ap
    WHERE ap.agent_id = auth.uid()
    AND (ap.can_manage_all = true OR ap.property_id = messages.property_id)
  )
);

-- Update the agent send policy to use profiles table
DROP POLICY IF EXISTS "Agents can send messages for assigned properties" ON public.messages;

CREATE POLICY "Agents can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'agent'
  )
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.agent_properties ap
    WHERE ap.agent_id = auth.uid()
    AND (ap.can_manage_all = true OR ap.property_id = messages.property_id)
  )
);