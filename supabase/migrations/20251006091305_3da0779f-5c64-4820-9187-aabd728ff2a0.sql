-- Clean up remaining unnecessary columns from messages table
-- Keep only the required fields: message_id, sender_id, recipient_tenant_id, room_id, property_id, message_text, timestamp

-- Drop unnecessary columns that still exist
ALTER TABLE messages DROP COLUMN IF EXISTS topic CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS extension CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS payload CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS event CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS private CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS updated_at CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS inserted_at CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS type CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS is_read CASCADE;

-- Ensure all required columns have proper constraints
ALTER TABLE messages ALTER COLUMN message_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN message_text SET NOT NULL;
ALTER TABLE messages ALTER COLUMN timestamp SET NOT NULL;
ALTER TABLE messages ALTER COLUMN timestamp SET DEFAULT now();

-- Ensure message_id is the primary key
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_pkey CASCADE;
ALTER TABLE messages ADD PRIMARY KEY (message_id);

-- Recreate indexes for efficient filtering
DROP INDEX IF EXISTS idx_messages_room_id;
DROP INDEX IF EXISTS idx_messages_property_id;
DROP INDEX IF EXISTS idx_messages_property_room;
DROP INDEX IF EXISTS idx_messages_recipient;
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_messages_timestamp;

CREATE INDEX idx_messages_room_id ON messages(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_messages_property_id ON messages(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_messages_property_room ON messages(property_id, room_id) WHERE property_id IS NOT NULL AND room_id IS NOT NULL;
CREATE INDEX idx_messages_recipient ON messages(recipient_tenant_id) WHERE recipient_tenant_id IS NOT NULL;
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

-- Add helpful comments
COMMENT ON TABLE messages IS 'Stores messages between users (owners, managers, tenants)';
COMMENT ON COLUMN messages.message_id IS 'Unique identifier for the message';
COMMENT ON COLUMN messages.sender_id IS 'User ID of the message sender (required)';
COMMENT ON COLUMN messages.recipient_tenant_id IS 'User ID of the recipient (nullable for broadcast messages)';
COMMENT ON COLUMN messages.room_id IS 'Room ID for room-specific messages (nullable)';
COMMENT ON COLUMN messages.property_id IS 'Property ID for property-scoped messages (nullable)';
COMMENT ON COLUMN messages.message_text IS 'The actual message content';
COMMENT ON COLUMN messages.timestamp IS 'When the message was created';