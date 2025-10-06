-- Clean up and restructure messages table to match required fields
-- Drop redundant columns and consolidate structure

-- First, backup any existing data by creating a temporary column for message consolidation
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_text_backup text;
UPDATE messages SET message_text_backup = COALESCE(content, message, subject);

-- Drop redundant columns
ALTER TABLE messages DROP COLUMN IF EXISTS message CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS subject CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS content CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS target_role CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS sender_role CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS updated_at CASCADE;

-- Rename backup to the standard name
ALTER TABLE messages RENAME COLUMN message_text_backup TO message_text;
ALTER TABLE messages ALTER COLUMN message_text SET NOT NULL;

-- Rename columns to match the required schema (only rename what needs renaming)
ALTER TABLE messages RENAME COLUMN id TO message_id;
ALTER TABLE messages RENAME COLUMN receiver_id TO recipient_tenant_id;
ALTER TABLE messages RENAME COLUMN created_at TO timestamp;

-- Ensure proper constraints
ALTER TABLE messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN message_text SET NOT NULL;
ALTER TABLE messages ALTER COLUMN timestamp SET NOT NULL;
ALTER TABLE messages ALTER COLUMN timestamp SET DEFAULT now();

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_room ON messages(property_id, room_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- Add helpful comments
COMMENT ON COLUMN messages.message_id IS 'Unique identifier for the message';
COMMENT ON COLUMN messages.sender_id IS 'User ID of the message sender';
COMMENT ON COLUMN messages.recipient_tenant_id IS 'User ID of the recipient tenant (nullable for broadcast messages)';
COMMENT ON COLUMN messages.room_id IS 'Room ID for tenant-specific messages';
COMMENT ON COLUMN messages.property_id IS 'Property ID for property-scoped messages';
COMMENT ON COLUMN messages.message_text IS 'The actual message content';
COMMENT ON COLUMN messages.timestamp IS 'When the message was created';