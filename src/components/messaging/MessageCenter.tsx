import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Users, AlertCircle, Building, Home, Building2, DollarSign, Check, CheckCheck, Wrench, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  property_id?: string;
  created_at: string;
  property_name?: string;
  room_number?: string;
  sender_name?: string;
  sender_role?: string;
  sender_email?: string;
  is_read?: boolean;
  read_at?: string;
}

interface MessageCenterProps {
  currentUserId: string;
  currentUserRole: 'owner' | 'manager' | 'tenant' | 'agent';
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
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomId || "owner");
  const [loading, setLoading] = useState(false);
  const [sendingToAll, setSendingToAll] = useState(false);
  const [recipientType, setRecipientType] = useState<'owner' | 'agent' | 'tenant'>('owner');
  const [agentRecipientType, setAgentRecipientType] = useState<'owner' | 'tenant'>('owner');
  const [availableRooms, setAvailableRooms] = useState<Array<{ id: string; room_number: string; tenant_name?: string; tenant_id?: string }>>([]);
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const fetchRoomsForProperty = async (propertyId: string) => {
    if (!propertyId || propertyId === 'all') {
      setAvailableRooms([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('rooms')
      .select('id, room_number, tenant_id, tenant_name')
      .eq('property_id', propertyId)
      .eq('is_occupied', true);
    
    if (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Could not load rooms for this property",
        variant: "destructive"
      });
      setAvailableRooms([]);
      return;
    }
    
    if (data && data.length > 0) {
      setAvailableRooms(data);
    } else {
      setAvailableRooms([]);
      toast({
        title: "No Occupied Rooms",
        description: "This property has no occupied rooms yet",
        variant: "default"
      });
    }
  };

  const fetchAgentsForProperty = async (propertyId: string) => {
    if (!propertyId || propertyId === 'all') {
      setAvailableAgents([]);
      return;
    }
    
    // First fetch agent assignments
    const { data: agentAssignments, error: agentError } = await supabase
      .from('agent_properties')
      .select('agent_id')
      .or(`can_manage_all.eq.true,property_id.eq.${propertyId}`);
    
    if (agentError || !agentAssignments || agentAssignments.length === 0) {
      setAvailableAgents([]);
      return;
    }
    
    // Then fetch profiles for those agents
    const agentIds = agentAssignments.map(a => a.agent_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', agentIds)
      .eq('role', 'agent');
    
    if (!profilesError && profiles) {
      setAvailableAgents(profiles.map(p => ({
        id: p.id,
        full_name: p.full_name || 'Unknown Agent'
      })));
      if (profiles.length > 0) {
        setSelectedAgentId(profiles[0].id);
      }
    }
  };

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('New message detected:', payload);
          
          // Check if this message is relevant to current user
          const newMsg = payload.new;
          const isRelevant = 
            newMsg.receiver_id === currentUserId || 
            newMsg.sender_id === currentUserId ||
            (currentUserRole === 'manager' && newMsg.property_id) ||
            (currentUserRole === 'agent' && newMsg.property_id);

          if (isRelevant && newMsg.sender_id !== currentUserId) {
            // Fetch sender details for toast
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, role, email')
              .eq('id', newMsg.sender_id)
              .single();

            const { data: property } = await supabase
              .from('properties')
              .select('name')
              .eq('id', newMsg.property_id)
              .maybeSingle();

            toast({
              title: `New Message from ${getRoleDisplayName(sender?.role || '')}`,
              description: `${sender?.full_name || 'Unknown'} (${sender?.email || 'No email'})\n${property?.name ? `${property.name} - ` : ''}${newMsg.content.substring(0, 50)}...`,
              duration: 5000,
            });
          }
          
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPropertyId, selectedRoomId, currentUserId, currentUserRole, toast]);

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', messageIds)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          properties(name),
          sender_profile:profiles!messages_sender_id_fkey(full_name, role, email)
        `)
        .not('content', 'ilike', '%MAINTENANCE REQUEST%')
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (currentUserRole === 'tenant') {
        // Tenants see: messages sent to them OR messages they sent
        query = query.or(`receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId}`);
      } else if (currentUserRole === 'owner') {
        // Owners see: messages they sent OR messages sent to them in their properties
        if (selectedPropertyId && selectedPropertyId !== 'all') {
          query = query.eq('property_id', selectedPropertyId);
        }
        // Show messages where owner is either sender or receiver
        query = query.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
      } else if (currentUserRole === 'manager') {
        // Managers see all messages for properties they manage (RLS handles filtering)
        // Apply property filter if specific property selected
        if (selectedPropertyId && selectedPropertyId !== 'all') {
          query = query.eq('property_id', selectedPropertyId);
        }
        // Don't add sender/receiver filter - let RLS policies handle authorization
      } else if (currentUserRole === 'agent') {
        // Agents see: messages sent to them OR messages they sent
        query = query.or(`receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId}`);
        
        // Optional: Add property filter if specific property selected
        if (selectedPropertyId && selectedPropertyId !== 'all') {
          query = query.eq('property_id', selectedPropertyId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading messages:', error);
        // Don't throw on first load, just show empty messages
        setMessages([]);
        return;
      }

      // Fetch room numbers for messages sent by tenants
      const messagesWithDetails = await Promise.all(
        (data || []).map(async (msg: any) => {
          let roomNumber = null;
          
          // Get room number if sender is a tenant
          if (msg.sender_profile?.role === 'tenant' && msg.property_id) {
            const { data: room } = await supabase
              .from('rooms')
              .select('room_number')
              .eq('property_id', msg.property_id)
              .eq('tenant_id', msg.sender_id)
              .maybeSingle();
            
            roomNumber = room?.room_number;
          }

          return {
            ...msg,
            property_name: msg.properties?.name,
            room_number: roomNumber,
            sender_name: msg.sender_profile?.full_name,
            sender_role: msg.sender_profile?.role,
            sender_email: msg.sender_profile?.email
          };
        })
      );

      setMessages(messagesWithDetails);
      
      // Mark unread messages that were sent to current user as read
      const unreadMessageIds = messagesWithDetails
        .filter(msg => msg.receiver_id === currentUserId && !msg.is_read)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        markMessagesAsRead(unreadMessageIds);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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

      console.log('Sending messages to properties:', propertiesToMessage);

      // Get all tenants from these properties
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('tenant_id, tenant_name, property_id, room_number, id')
        .in('property_id', propertiesToMessage)
        .not('tenant_id', 'is', null);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw new Error(`Database error: ${roomsError.message}`);
      }

      console.log('Found rooms with tenants:', rooms);

      if (!rooms || rooms.length === 0) {
        throw new Error("No tenants found in the selected properties. Please invite tenants first.");
      }

      // Create message for each tenant
      const messagesToInsert = rooms.map(room => ({
        sender_id: currentUserId,
        receiver_id: room.tenant_id,
        property_id: room.property_id,
        content: newMessage,
        created_at: new Date().toISOString()
      }));

      console.log('Inserting messages:', messagesToInsert);

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
        description: `Message delivered to ${rooms.length} tenant(s). SMS notifications will be sent to available phone numbers.`
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
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // Determine receiver based on role and get recipient details
      let receiverId = null;
      let recipientName = "recipient";
      
      if (currentUserRole === 'tenant') {
        // Tenant sending to owner or agent based on selection
        if (propertyId || (selectedPropertyId && selectedPropertyId !== 'all')) {
          const targetPropertyId = propertyId || selectedPropertyId;
          
          if (recipientType === 'agent') {
            // Find agent assigned to this property
            const { data: agentAssignment, error: agentError } = await supabase
              .from('agent_properties')
              .select('agent_id')
              .or(`can_manage_all.eq.true,property_id.eq.${targetPropertyId}`)
              .limit(1)
              .maybeSingle();
            
            if (agentError) {
              console.error('Error fetching agent:', agentError);
              throw agentError;
            }
            
            if (!agentAssignment) {
              toast({
                title: "No Agent Assigned",
                description: "No financial agent is assigned to this property yet. Please contact the property owner or select 'Property Owner (via Manager)' instead.",
                variant: "destructive",
              });
              setLoading(false);
              return;
            }
            
            // Fetch agent's profile details
            const { data: agentProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', agentAssignment.agent_id)
              .single();
            
            receiverId = agentAssignment.agent_id;
            recipientName = agentProfile?.full_name || "Financial Agent";
          } else {
            // Send to property owner (existing logic)
            const { data: property, error: propError } = await supabase
              .from('properties')
              .select('owner_id, profiles!properties_owner_id_fkey(full_name)')
              .eq('id', targetPropertyId)
              .single();
            
            if (propError) throw propError;
            receiverId = property?.owner_id;
            recipientName = property?.profiles?.full_name || "property owner";
          }
        }
      } else if (currentUserRole === 'owner') {
        // Owner sending to tenant or agent
        if (recipientType === 'agent') {
          // Owner sending to agent
          if (!selectedAgentId) {
            throw new Error("Please select an agent");
          }
          
          const { data: agentProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', selectedAgentId)
            .single();
          
          receiverId = selectedAgentId;
          recipientName = agentProfile?.full_name || "Financial Agent";
        } else {
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
      } else if (currentUserRole === 'agent') {
        // Agent sending to tenant or owner
        if (!selectedRoomId && !propertyId && (!selectedPropertyId || selectedPropertyId === 'all')) {
          throw new Error("Please select a property or room to send a message");
        }
        
        // Handle "Send to All Tenants" option
        if (selectedRoomId === 'all' && agentRecipientType === 'tenant') {
          const tenantIds = availableRooms
            .filter(room => room.tenant_id)
            .map(room => room.tenant_id);

          if (tenantIds.length === 0) {
            throw new Error("No tenants found in the selected property");
          }

          // Send message to all tenants
          const messages = tenantIds.map(tenantId => ({
            content: newMessage,
            sender_id: currentUserId,
            receiver_id: tenantId,
            property_id: selectedPropertyId || null,
          }));

          const { data: insertedMessages, error: insertError } = await supabase
            .from("messages")
            .insert(messages)
            .select('id, sender_id, receiver_id, content, created_at');

          if (insertError) throw insertError;

          // Send SMS notifications for all messages
          if (insertedMessages) {
            insertedMessages.forEach((msg) => {
              supabase.functions
                .invoke('send-sms-notification', {
                  body: {
                    message_id: msg.id,
                    sender_id: msg.sender_id,
                    receiver_id: msg.receiver_id,
                    content: msg.content,
                    created_at: msg.created_at,
                  },
                })
                .catch((error) => {
                  console.warn('SMS notification failed (non-blocking):', error);
                });
            });
          }

          setNewMessage("");
          loadMessages();

          toast({
            title: "Messages Sent",
            description: `Message sent to ${tenantIds.length} tenant(s). SMS notifications will be sent to available phone numbers.`
          });
          
          setLoading(false);
          return;
        }
        
        // If room selected (and not "owner"), send to tenant
        if (selectedRoomId && selectedRoomId !== 'owner') {
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
        } else {
          // Send to property owner
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
      }

      if (!receiverId) {
        throw new Error("Could not determine message recipient. Please select a property or room.");
      }

      const messagePayload = {
        sender_id: currentUserId,
        receiver_id: receiverId,
        property_id: propertyId || (selectedPropertyId && selectedPropertyId !== 'all' ? selectedPropertyId : null),
        content: newMessage,
        created_at: new Date().toISOString()
      };

      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert([messagePayload])
        .select('id, sender_id, receiver_id, content, created_at')
        .single();

      if (error) throw error;

      // Send SMS notification in the background (don't wait for it or block on errors)
      if (insertedMessage) {
        supabase.functions.invoke('send-sms-notification', {
          body: {
            message_id: insertedMessage.id,
            sender_id: insertedMessage.sender_id,
            receiver_id: insertedMessage.receiver_id,
            content: insertedMessage.content,
            created_at: insertedMessage.created_at
          }
        }).catch((smsError) => {
          console.warn('SMS notification failed (non-blocking):', smsError);
        });
      }

      setNewMessage("");
      loadMessages();

      toast({
        title: "Message Sent",
        description: `Message sent successfully to ${recipientName}. SMS notification will be sent if phone number is available.`
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
      case 'agent': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Property Owner';
      case 'manager': return 'Property Manager';
      case 'tenant': return 'Tenant';
      case 'agent': return 'Financial Agent';
      default: return 'User';
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
              <Select value={selectedPropertyId} onValueChange={(value) => {
                setSelectedPropertyId(value);
                if (currentUserRole === 'owner') {
                  if (value !== 'all') {
                    fetchRoomsForProperty(value);
                    if (recipientType === 'agent') {
                      fetchAgentsForProperty(value);
                    }
                  } else {
                    setAvailableRooms([]);
                    setAvailableAgents([]);
                  }
                }
              }}>
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
              ? "Send a message to property management. SMS notifications will be sent automatically."
              : currentUserRole === 'agent'
              ? "Send messages to property owners or tenants. Choose recipient type and property to start messaging."
              : "Send messages to tenants or staff. SMS notifications will be sent automatically to recipients with registered phone numbers."
            }
          </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUserRole === 'tenant' && (
              <div className="space-y-2">
                <Label htmlFor="recipient-select">Send To:</Label>
                <Select value={recipientType} onValueChange={(value: 'owner' | 'agent') => setRecipientType(value)}>
                  <SelectTrigger id="recipient-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Property Owner (via Manager)
                      </div>
                    </SelectItem>
                    <SelectItem value="agent">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial Agent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose Owner for general property matters, Agent for rent/payment issues
                </p>
              </div>
            )}
            {currentUserRole === 'owner' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="owner-recipient-select">Send To:</Label>
                  <Select value={recipientType} onValueChange={(value: 'tenant' | 'agent') => {
                    setRecipientType(value);
                    if (value === 'agent' && selectedPropertyId && selectedPropertyId !== 'all') {
                      fetchAgentsForProperty(selectedPropertyId);
                    }
                  }}>
                    <SelectTrigger id="owner-recipient-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Tenant
                        </div>
                      </SelectItem>
                      <SelectItem value="agent">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Financial Agent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {recipientType === 'agent' && (
                  <div className="space-y-2">
                    <Label htmlFor="agent-select">Select Agent:</Label>
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                      <SelectTrigger id="agent-select">
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAgents.length > 0 ? (
                          availableAgents.map(agent => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.full_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No agents available for this property
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {recipientType === 'tenant' && selectedPropertyId && selectedPropertyId !== 'all' && (
                  <div className="space-y-2">
                    <Label htmlFor="room-select">Select Room:</Label>
                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                      <SelectTrigger id="room-select">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.length > 0 ? (
                          availableRooms.map(room => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.room_number} - {room.tenant_name || 'Tenant'}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No occupied rooms in this property
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
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
                {recipientType === 'tenant' && (
                  <>
                    <Button 
                      onClick={sendToAllTenants}
                      disabled={!newMessage.trim() || sendingToAll}
                      className="bg-gradient-hero hover:shadow-glow flex-1"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {sendingToAll ? 'Sending...' : 'Send to All Tenants'}
                    </Button>
                    {selectedRoomId && selectedRoomId !== 'owner' && (
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
                  </>
                )}
                {recipientType === 'agent' && (
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading || !selectedAgentId}
                    className="bg-gradient-hero hover:shadow-glow w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? 'Sending...' : 'Send to Agent'}
                  </Button>
                )}
              </div>
            )}
            {currentUserRole === 'agent' && (
              <div className="space-y-4">
                {/* Recipient Type Selector */}
                <div className="space-y-2">
                  <Label htmlFor="agent-recipient-type">Send To</Label>
                  <Select 
                    value={agentRecipientType} 
                    onValueChange={(value: 'owner' | 'tenant') => {
                      setAgentRecipientType(value);
                      setSelectedRoomId("");
                    }}
                  >
                    <SelectTrigger id="agent-recipient-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Property Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Selection */}
                <div className="space-y-2">
                  <Label htmlFor="agent-property-select">Select Property</Label>
                  <Select 
                    value={selectedPropertyId} 
                    onValueChange={(value) => {
                      setSelectedPropertyId(value);
                      setSelectedRoomId("");
                      if (value !== 'all' && agentRecipientType === 'tenant') {
                        fetchRoomsForProperty(value);
                      } else {
                        setAvailableRooms([]);
                      }
                    }}
                  >
                    <SelectTrigger id="agent-property-select">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Room Selection - Only for Tenant Recipient Type */}
                {selectedPropertyId && selectedPropertyId !== 'all' && agentRecipientType === 'tenant' && (
                  <div className="space-y-2">
                    <Label htmlFor="agent-room-select">Select Recipient</Label>
                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                      <SelectTrigger id="agent-room-select">
                        <SelectValue placeholder="Choose recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2 font-semibold">
                            <Users className="h-4 w-4" />
                            Send to All Tenants
                          </div>
                        </SelectItem>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Room {room.room_number}
                              {room.tenant_name && ` - ${room.tenant_name}`}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button 
                  onClick={sendMessage}
                  disabled={
                    !newMessage.trim() || 
                    loading || 
                    !selectedPropertyId || 
                    selectedPropertyId === 'all' ||
                    (agentRecipientType === 'tenant' && !selectedRoomId)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? 'Sending...' : `Send to ${agentRecipientType === 'owner' ? 'Property Owner' : 'Tenant'}`}
                </Button>
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {messages.length} total
              </Badge>
              {messages.filter(m => m.receiver_id === currentUserId && !m.is_read).length > 0 && (
                <Badge variant="default" className="bg-primary">
                  {messages.filter(m => m.receiver_id === currentUserId && !m.is_read).length} unread
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] lg:max-h-[700px] overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isSentByMe = message.sender_id === currentUserId;
                
                return (
                  <div 
                    key={message.id} 
                    className={`border rounded-lg p-4 space-y-3 ${
                      isSentByMe 
                        ? 'bg-primary/5 border-primary/20' 
                        : message.is_read 
                        ? 'bg-card' 
                        : 'bg-accent/20 border-accent/30'
                    }`}
                  >
                    {/* Header with Property and Room Info */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Property Name Badge */}
                        {message.property_name && (
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            <Building className="h-3 w-3 mr-1" />
                            {message.property_name}
                          </Badge>
                        )}
                        
                        {/* Room Number Badge */}
                        {message.room_number && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <Home className="h-3 w-3 mr-1" />
                            {message.room_number.charAt(0).toUpperCase() + message.room_number.slice(1)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Timestamp and Read Receipt */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleDateString()} {' '}
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        
                        {/* Read Receipt for sent messages */}
                        {isSentByMe && (
                          <div className="flex items-center gap-1">
                            {message.is_read ? (
                              <CheckCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Check className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        
                        {/* Unread indicator for received messages */}
                        {!isSentByMe && !message.is_read && (
                          <Badge variant="default" className="bg-primary text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Sender Info - Enhanced with Role, Name, and Context */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Role Icon */}
                        {!isSentByMe && message.sender_role === 'agent' && <DollarSign className="h-4 w-4 text-emerald-600" />}
                        {!isSentByMe && message.sender_role === 'owner' && <Building2 className="h-4 w-4 text-blue-600" />}
                        {!isSentByMe && message.sender_role === 'tenant' && <User className="h-4 w-4 text-yellow-600" />}
                        
                        {/* Maintenance Request Indicator */}
                        {message.content.includes('[MAINTENANCE REQUEST') && (
                          <Badge variant="destructive" className="bg-orange-500">
                            <Wrench className="h-3 w-3 mr-1" />
                            Maintenance
                          </Badge>
                        )}
                        
                        <Badge 
                          variant={isSentByMe ? "default" : "secondary"}
                          className={isSentByMe ? "" : getRoleColor(message.sender_role || '')}
                        >
                          {isSentByMe 
                            ? 'You' 
                            : getRoleDisplayName(message.sender_role || 'User')
                          }
                        </Badge>
                        
                        {!isSentByMe && (
                          <>
                            {message.sender_name && (
                              <span className="text-sm font-semibold text-foreground">
                                {message.sender_name}
                              </span>
                            )}
                            {/* Enhanced Context Display */}
                            {message.sender_role === 'tenant' && message.room_number && message.property_name && (
                              <span className="text-xs text-muted-foreground">
                                from Room {message.room_number}, {message.property_name}
                              </span>
                            )}
                            {message.sender_role === 'agent' && message.property_name && (
                              <span className="text-xs text-muted-foreground">
                                for {message.property_name}
                              </span>
                            )}
                            {message.sender_role === 'owner' && message.property_name && (
                              <span className="text-xs text-muted-foreground">
                                regarding {message.property_name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <p className="text-sm leading-relaxed pl-2 border-l-2 border-primary/20">
                      {message.content}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a conversation by sending a message
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageCenter;