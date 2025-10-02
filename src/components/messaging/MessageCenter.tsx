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
  receiver_id?: string;
  property_id?: string;
  room_id?: string;
  type: string;
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
  const [messageType, setMessageType] = useState<'general' | 'maintenance' | 'announcement'>('general');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [selectedPropertyId, selectedRoomId]);

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, role)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      // Additional filters based on selections
      if (selectedPropertyId && selectedPropertyId !== 'all') {
        query = query.eq('property_id', selectedPropertyId);
        if (selectedRoomId) {
          query = query.eq('room_id', selectedRoomId);
        }
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
      // Determine receiver based on role
      let receiverId = null;
      if (currentUserRole === 'tenant') {
        // Tenant sending to owner - get property owner
        if (selectedPropertyId && selectedPropertyId !== 'all') {
          const { data: property } = await supabase
            .from('properties')
            .select('owner_id')
            .eq('id', selectedPropertyId)
            .single();
          receiverId = property?.owner_id;
        }
      } else if (currentUserRole === 'owner') {
        // Owner sending to tenant - get tenant from room
        if (selectedRoomId) {
          const { data: room } = await supabase
            .from('rooms')
            .select('tenant_id')
            .eq('id', selectedRoomId)
            .single();
          receiverId = room?.tenant_id;
        }
      }

      const messageData = {
        content: newMessage,
        message: newMessage, // Keep for backward compatibility
        sender_id: currentUserId,
        receiver_id: receiverId,
        property_id: selectedPropertyId && selectedPropertyId !== 'all' ? selectedPropertyId : null,
        room_id: selectedRoomId || null,
        type: messageType
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage("");
      loadMessages();

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
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

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <AlertCircle className="h-4 w-4" />;
      case 'announcement': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="messageType">Message Type</Label>
                <Select value={messageType} onValueChange={(value) => setMessageType(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <div key={message.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(message.sender_role || 'unknown')}>
                        {message.sender_role?.charAt(0).toUpperCase() + message.sender_role?.slice(1)}
                      </Badge>
                      <span className="font-medium text-sm">{message.sender_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getMessageTypeIcon(message.type)}
                    <Badge variant="outline" className="text-xs">
                      {message.type}
                    </Badge>
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