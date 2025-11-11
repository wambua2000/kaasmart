-- Add read receipt columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- Create index for filtering unread messages
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Update RLS policy to allow recipients to mark messages as read
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);