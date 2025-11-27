-- Allow users to view profiles of people they have exchanged messages with
CREATE POLICY "Users can view profiles of message participants"
ON public.profiles
FOR SELECT
USING (
  -- Can view profile if this person has sent you a message
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.sender_id = profiles.id 
    AND messages.receiver_id = auth.uid()
  )
  OR
  -- Can view profile if this person has received a message from you
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.receiver_id = profiles.id 
    AND messages.sender_id = auth.uid()
  )
);