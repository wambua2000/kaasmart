
-- Add FK from messages.sender_id to profiles.id
ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id);

-- Add FK from messages.receiver_id to profiles.id
ALTER TABLE public.messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);

-- Add FK from properties.owner_id to profiles.id
ALTER TABLE public.properties
  ADD CONSTRAINT properties_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
