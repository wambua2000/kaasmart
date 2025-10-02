-- Add RLS policy to allow Managers to view all messages
CREATE POLICY "Managers can view all messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'manager'
  )
);

-- Add policy to allow Property Owners to view all messages for their properties
-- This ensures owners see both messages they sent and messages from tenants
CREATE POLICY "Owners can view property messages"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = messages.property_id 
    AND p.owner_id = auth.uid()
  )
);