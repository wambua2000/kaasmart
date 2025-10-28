-- Add foreign key constraint for sender_id
ALTER TABLE messages
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for receiver_id
ALTER TABLE messages
ADD CONSTRAINT messages_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;