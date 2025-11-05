-- Add policy for agents to view their direct messages
CREATE POLICY "Agents can view their direct messages"
  ON messages
  FOR SELECT
  USING (
    has_role(auth.uid(), 'agent'::app_role) 
    AND (auth.uid() = sender_id OR auth.uid() = receiver_id)
  );