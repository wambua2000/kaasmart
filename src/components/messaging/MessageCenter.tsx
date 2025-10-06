import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  message_id: string;
  message_text: string;
  sender_id: string;
  recipient_tenant_id?: string;
  property_id?: string;
  room_id?: string;
  timestamp: string;
  sender_name?: string;
  sender_role?: string;
}

interface MessageCenterProps {
  currentUserId: string;
  currentUserRole: 'owner' | 'manager' | 'tenant';
  properties?: Array<{ id: string; name: string }>;
  roomId?: string;
  propertyId?: string;
}

const MessageCenter = ({ 
  currentUserId, 
  currentUserRole, 
  properties = [], 
  roomId, 
  propertyId 
}: MessageCenterProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId || "all");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUserId}`,
        },
        () => {
          console.log('Message change detected - reloading messages');
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => {
          console.log('Message received - reloading messages');
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPropertyId, selectedRoomId, currentUserId]);

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, role),
          property:properties(name),
          room:rooms(room_number)
        `)
        .order('timestamp', { ascending: false });

      // Filter based on user role
      if (currentUserRole === 'tenant') {
        // Tenants see: messages sent to them OR messages they sent
        query = query.or(`recipient_tenant_id.eq.${currentUserId},sender_id.eq.${currentUserId}`);
        // If roomId provided, filter by it
        if (roomId) {
          query = query.eq('room_id', roomId);
        }
      } else if (currentUserRole === 'owner') {
        // Owners see: messages they sent OR messages for their properties
        query = query.or(`sender_id.eq.${currentUserId},property_id.in.(select id from properties where owner_id = ${currentUserId})`);
        
        // Additional filters based on selections
        if (selectedPropertyId && selectedPropertyId !== 'all') {
          query = query.eq('property_id', selectedPropertyId);
          if (selectedRoomId) {
            query = query.eq('room_id', selectedRoomId);
          }
        }
      } else if (currentUserRole === 'manager') {
        // Managers see all messages (view only)
        query = query.or(`sender_id.eq.${currentUserId},recipient_tenant_id.eq.${currentUserId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender?.full_name || 'Unknown',
        sender_role: msg.sender?.role || 'unknown'
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      // Determine receiver based on role and get recipient details
      let receiverId = null;
      let recipientName = "recipient";
      
      if (currentUserRole === 'tenant') {
        // Tenant sending to owner - get property owner
        if (propertyId || (selectedPropertyId && selectedPropertyId !== 'all')) {
          const targetPropertyId = propertyId || selectedPropertyId;
          const { data: property, error: propError } = await supabase
            .from('properties')
            .select('owner_id, profiles!properties_owner_id_fkey(full_name)')
            .eq('id', targetPropertyId)
            .single();
          
          if (propError) throw propError;
          receiverId = property?.owner_id;
          recipientName = property?.profiles?.full_name || "property owner";
        }
      } else if (currentUserRole === 'owner') {
        // Owner sending to tenant - MUST have a room selected
        if (!selectedRoomId) {
          throw new Error("Please select a room to send a message to a specific tenant");
        }
        
        const { data: room, error: roomError } = await supabase
          .from('rooms')
          .select('tenant_id, tenant_name, property_id')
          .eq('id', selectedRoomId)
          .single();
        
        if (roomError) throw roomError;
        
        if (!room?.tenant_id) {
          throw new Error("This room doesn't have a tenant assigned yet");
        }
        
        receiverId = room.tenant_id;
        recipientName = room.tenant_name || "tenant";
      }

      if (!receiverId) {
        throw new Error("Could not determine message recipient. Please select a property or room.");
      }

      const messagePayload = {
        sender_id: user.id,
        recipient_tenant_id: receiverId,
        property_id: propertyId || (selectedPropertyId && selectedPropertyId !== 'all' ? selectedPropertyId : null),
        room_id: roomId || selectedRoomId || null,
        message_text: newMessage,
      };

      console.log("Sending message with payload:", messagePayload);

      const { data, error } = await supabase
        .from('messages')
        .insert([messagePayload])
        .select();

      if (error) {
        console.error("Message send error:", error);
        throw error;
      }

      console.log("Message sent successfully:", data);
      setNewMessage("");
      loadMessages(); // Reload to show the new message immediately

      toast({
        title: "Message Sent",
        description: `Message sent successfully to ${recipientName}`
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'tenant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Filters */}
      {currentUserRole !== 'tenant' && (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Message Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Message - Only for owners and tenants */}
      {currentUserRole !== 'manager' && (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Message
            </CardTitle>
            <CardDescription>
              {currentUserRole === 'tenant' 
                ? "Send a message to property management"
                : "Send a message to tenants or staff"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="resize-none"
              />
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              className="bg-gradient-hero hover:shadow-glow"
            >
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View-only notice for managers */}
      {currentUserRole === 'manager' && (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                You have view-only access to messages. You can see messages from property owners and maintenance requests from tenants.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Messages
            </div>
            <Badge variant="secondary">
              {messages.length} messages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.message_id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(message.sender_role || 'unknown')}>
                        {message.sender_role?.charAt(0).toUpperCase() + message.sender_role?.slice(1)}
                      </Badge>
                      <span className="font-medium text-sm">{message.sender_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                   </div>
                   <p className="text-sm leading-relaxed">{message.message_text}</p>
                 </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start a conversation by sending a message</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageCenter;