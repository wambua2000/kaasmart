-- Drop existing messages table to recreate with proper structure
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table with proper structure
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_property ON public.messages(property_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- RLS Policy: Users can only send messages as themselves
CREATE POLICY "Users can send messages as themselves"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- RLS Policy: Users can update their own sent messages
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;