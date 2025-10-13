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
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  created_at: string;
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
  const [sendingToAll, setSendingToAll] = useState(false);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message change detected:', payload);
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
        .select('*')
        .order('created_at', { ascending: false });

      // Filter based on user role - users see messages where they are sender or receiver
      query = query.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      // Additional filter by property if selected
      if (currentUserRole === 'owner' && selectedPropertyId && selectedPropertyId !== 'all') {
        query = query.eq('property_id', selectedPropertyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error Loading Messages",
          description: error.message,
          variant: "destructive"
        });
        setMessages([]);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
      setMessages([]);
    }
  };

  const sendToAllTenants = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message before sending",
        variant: "destructive"
      });
      return;
    }

    setSendingToAll(true);
    try {
      // Get all properties owned by this owner
      const propertiesToMessage = selectedPropertyId && selectedPropertyId !== 'all' 
        ? [selectedPropertyId] 
        : properties.map(p => p.id);

      if (propertiesToMessage.length === 0) {
        throw new Error("No properties found. Please add properties first.");
      }

      // Get all tenants from these properties
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('tenant_id, property_id')
        .in('property_id', propertiesToMessage)
        .not('tenant_id', 'is', null);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw new Error(`Database error: ${roomsError.message}`);
      }

      if (!rooms || rooms.length === 0) {
        throw new Error("No tenants found in the selected properties. Please invite tenants first.");
      }

      // Create message for each tenant
      const messagesToInsert = rooms.map(room => ({
        sender_id: currentUserId,
        receiver_id: room.tenant_id,
        property_id: room.property_id,
        content: newMessage
      }));

      const { error: insertError } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (insertError) {
        console.error('Error inserting messages:', insertError);
        throw new Error(`Failed to save messages: ${insertError.message}`);
      }

      setNewMessage("");
      loadMessages();

      toast({
        title: "Messages Sent Successfully!",
        description: `Message delivered to ${rooms.length} tenant(s)`
      });
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Failed to send messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingToAll(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message before sending",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Determine receiver based on role and get recipient details
      let receiverId = null;
      let recipientName = "recipient";
      let targetPropertyId = null;
      
      if (currentUserRole === 'tenant') {
        // Tenant sending to owner - get property owner
        if (propertyId || (selectedPropertyId && selectedPropertyId !== 'all')) {
          targetPropertyId = propertyId || selectedPropertyId;
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
        targetPropertyId = room.property_id;
      }

      if (!receiverId) {
        throw new Error("Could not determine message recipient. Please select a property or room.");
      }

      const messagePayload = {
        sender_id: currentUserId,
        receiver_id: receiverId,
        property_id: targetPropertyId,
        content: newMessage,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('messages')
        .insert([messagePayload]);

      if (error) throw error;

      setNewMessage("");
      loadMessages();

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
            {currentUserRole === 'owner' && (
              <div className="flex gap-2">
                <Button 
                  onClick={sendToAllTenants}
                  disabled={!newMessage.trim() || sendingToAll}
                  className="bg-gradient-hero hover:shadow-glow flex-1"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {sendingToAll ? 'Sending...' : 'Send to All Tenants'}
                </Button>
                {selectedRoomId && (
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? 'Sending...' : 'Send to Selected Room'}
                  </Button>
                )}
              </div>
            )}
            {currentUserRole === 'tenant' && (
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-gradient-hero hover:shadow-glow"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            )}
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
                <div key={message.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {message.sender_id === currentUserId ? 'Sent' : 'Received'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                   </div>
                   <p className="text-sm leading-relaxed">{message.content}</p>
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