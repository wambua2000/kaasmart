-- Add new columns to existing messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'chat';

-- Migrate existing data: copy 'message' to 'content' and 'tenant_id' to 'receiver_id'
UPDATE public.messages 
SET content = message,
    receiver_id = tenant_id
WHERE content IS NULL;

-- Make content NOT NULL after migration
ALTER TABLE public.messages 
ALTER COLUMN content SET NOT NULL;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Property owners can manage messages for their properties" ON public.messages;
DROP POLICY IF EXISTS "Tenants can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Managers cannot send messages" ON public.messages;
DROP POLICY IF EXISTS "Managers can view messages for properties they manage" ON public.messages;

-- Create new RLS policies for the messaging system
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Sender can view own sent messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id);

CREATE POLICY "Receiver can view own received messages"
ON public.messages
FOR SELECT
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can view messages for their properties"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = messages.property_id 
    AND p.owner_id = auth.uid()
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property ON public.messages(property_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;