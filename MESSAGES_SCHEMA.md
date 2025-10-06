# Messages Schema Documentation

## Table Structure

The `messages` table has been updated to the following structure:

```typescript
interface Message {
  message_id: string;           // UUID - Unique identifier
  sender_id: string;             // UUID - User ID of sender (NOT NULL)
  recipient_tenant_id: string;   // UUID - User ID of recipient (nullable for broadcasts)
  room_id: string;               // UUID - Room ID for room-specific messages
  property_id: string;           // UUID - Property ID for property-scoped messages
  message_text: string;          // TEXT - The actual message content (NOT NULL)
  timestamp: timestamp;          // Timestamp - When message was created
  type: string;                  // TEXT - Message type (chat, maintenance, announcement)
  is_read: boolean;              // BOOLEAN - Read status
}
```

## Filtering Messages

### By Room (Tenant View)
```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('room_id', roomId)
  .order('timestamp', { ascending: false });
```

### By Property and Room (Owner View)
```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('property_id', propertyId)
  .eq('room_id', roomId)
  .order('timestamp', { ascending: false });
```

### By Property Only (All rooms in a property)
```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('property_id', propertyId)
  .order('timestamp', { ascending: false });
```

## Indexes

The following indexes have been created for optimal query performance:

- `idx_messages_room_id` - For filtering by room
- `idx_messages_property_id` - For filtering by property
- `idx_messages_property_room` - Composite index for property + room queries
- `idx_messages_recipient` - For filtering by recipient
- `idx_messages_sender` - For filtering by sender
- `idx_messages_timestamp` - For ordering by time (DESC)

## Row Level Security (RLS)

Messages are protected by RLS policies that ensure:
- Senders can view their own sent messages
- Recipients can view messages sent to them
- Property owners can view messages for their properties
- Managers can view messages for properties they manage
- Tenants can only view messages related to their room
