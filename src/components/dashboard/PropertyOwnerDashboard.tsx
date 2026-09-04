import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Home, Users, DollarSign, Plus, MapPin, Mail, FileText, Settings, ExternalLink, Wrench, MessageSquare, Eye, Trash2, Pencil, KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/AppFooter";
import MessageCenter from "@/components/messaging/MessageCenter";
import apartmentInterior from "@/assets/apartment-interior.jpg";
import skylineApartment from "@/assets/skyline-apartment.jpg";
import yellowHouse from "@/assets/yellow-house.jpg";
import whiteHouse from "@/assets/white-house.jpg";
import greenHouse from "@/assets/green-house.jpg";
import RoomDetailsModal from "@/components/property/RoomDetailsModal";
import AddPropertyModal from "@/components/property/AddPropertyModal";
import EditPropertyModal from "@/components/property/EditPropertyModal";
import RoomManagementModal from "@/components/property/RoomManagementModal";
import ReportModal from "@/components/property/ReportModal";
import DocumentReport from "@/components/property/DocumentReport";
import InviteManagerModal from "@/components/manager/InviteManagerModal";
import { InviteAgentModal } from "@/components/agent/InviteAgentModal";
import PasswordResetRequestsSheet from "@/components/property/PasswordResetRequestsSheet";
import AllLeaseDocumentsViewer from "@/components/property/AllLeaseDocumentsViewer";
import { RoleChatbot } from "@/components/chat/RoleChatbot";
import { supabase } from "@/integrations/supabase/client";
import { parseMaintenanceRequest, getPriorityVariant, getStatusVariant, updateMaintenanceStatus } from "@/lib/maintenanceUtils";

interface Property {
  id: string;
  name: string;
  location: string;
  rent_per_room: number;
  total_rooms: number;
  occupiedRooms: number;
  image_url?: string;
}

const PropertyOwnerDashboard = () => {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isEditPropertyModalOpen, setIsEditPropertyModalOpen] = useState(false);
  const [isRoomManagementOpen, setIsRoomManagementOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDocumentReportOpen, setIsDocumentReportOpen] = useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [isInviteAgentOpen, setIsInviteAgentOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [pendingResetCount, setPendingResetCount] = useState(0);
  const [maintenanceMessages, setMaintenanceMessages] = useState<Array<{
    id: string;
    property: string;
    room: string;
    tenant: string;
    message: string;
    timestamp: string;
    priority: string;
    category: string;
    status: string;
    fullContent: string;
  }>>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
  const [isLeaseAgreementsOpen, setIsLeaseAgreementsOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, prop) => sum + prop.total_rooms, 0);
  const occupiedRooms = properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0);
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : "0.0";

  // Fetch properties from database - wrapped in useCallback for stability
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      // Get authenticated user from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        setLoading(false);
        return;
      }

      // Fetch properties with room counts using the authenticated user's ID
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          location,
          rent_per_room,
          total_rooms,
          image_url,
          rooms (
            id,
            is_occupied
          )
        `)
        .eq('owner_id', user.id);

      if (error) {
        console.error("Error fetching properties:", error);
        setLoading(false);
        return;
      }

      // Transform data to include occupiedRooms count
      const transformedProperties = propertiesData?.map(property => ({
        id: property.id,
        name: property.name,
        location: property.location,
        rent_per_room: property.rent_per_room,
        total_rooms: property.total_rooms,
        occupiedRooms: property.rooms?.filter(room => room.is_occupied).length || 0,
        image_url: property.image_url || undefined,
      })) || [];

      // Set only database properties
      setProperties(transformedProperties);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setLoading(false);
    }
  }, []);

  // Fetch pending password reset count
  const fetchPendingResetCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('user_role', ['tenant', 'manager', 'agent']);

      if (error) throw error;
      setPendingResetCount(count || 0);
    } catch (error) {
      console.error("Error fetching pending reset count:", error);
    }
  }, []);

  // Fetch maintenance requests with property and room details
  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get the owner's property IDs
      const { data: ownerProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      const propertyIds = ownerProperties?.map(p => p.id) || [];

      console.log('Property Owner - User ID:', user.id);
      console.log('Property Owner - Property IDs:', propertyIds);

      if (propertyIds.length === 0) {
        setMaintenanceMessages([]);
        return;
      }

      // Fetch maintenance messages for owned properties
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          property_id,
          sender_id,
          profiles!messages_sender_id_fkey(full_name)
        `)
        .in('property_id', propertyIds)
        .ilike('content', '%MAINTENANCE REQUEST%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Property Owner - Messages fetched:', messages?.length || 0);

      // Fetch room and property details for each message
      const messagesWithDetails = await Promise.all(
        (messages || []).map(async (msg) => {
          // Fetch room details for the sender (tenant)
          const { data: roomData } = await supabase
            .from('rooms')
            .select(`
              room_number,
              properties (
                name
              )
            `)
            .eq('tenant_id', msg.sender_id)
            .eq('property_id', msg.property_id)
            .maybeSingle();

          const parsed = parseMaintenanceRequest(msg.content);

          console.log('Maintenance Request Debug:', {
            messageId: msg.id,
            rawStatus: msg.content.match(/Status:\s*([^\n]+)/i)?.[1],
            parsedStatus: parsed.status,
            willShowButton: parsed.status === 'Pending Review'
          });

          return {
            id: msg.id,
            property: roomData?.properties?.name || 'Unknown Property',
            room: roomData?.room_number || 'N/A',
            tenant: (msg.profiles as any)?.full_name || 'Unknown Tenant',
            message: parsed.description,
            timestamp: new Date(msg.created_at).toLocaleString(),
            priority: parsed.priority,
            category: parsed.category,
            status: parsed.status,
            fullContent: msg.content
          };
        })
      );

      setMaintenanceMessages(messagesWithDetails);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    }
  }, []);

  // Fetch maintenance request count
  const fetchMaintenanceCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get owner's property IDs
      const { data: ownerProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      const propertyIds = ownerProperties?.map(p => p.id) || [];

      if (propertyIds.length === 0) {
        setMaintenanceCount(0);
        return;
      }

      // Count maintenance messages with "Pending Review" status
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content')
        .in('property_id', propertyIds)
        .ilike('content', '%MAINTENANCE REQUEST%')
        .ilike('content', '%Status: Pending Review%');

      setMaintenanceCount(messages?.length || 0);
    } catch (error) {
      console.error('Error fetching maintenance count:', error);
      setMaintenanceCount(0);
    }
  }, []);

  // Fetch message count
  const fetchMessageCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get owner's property IDs
      const { data: ownerProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      const propertyIds = ownerProperties?.map(p => p.id) || [];

      if (propertyIds.length === 0) {
        setMessageCount(0);
        return;
      }

      // Count regular messages (not maintenance requests) where owner is the receiver
      const { data: messages } = await supabase
        .from('messages')
        .select('id, sender_id, profiles!messages_sender_id_fkey(role)')
        .in('property_id', propertyIds)
        .eq('receiver_id', user.id)
        .not('content', 'ilike', '%MAINTENANCE REQUEST%');

      // Only count messages from tenants (not from other owners/managers)
      const tenantMessages = messages?.filter(
        (msg: any) => msg.profiles?.role === 'tenant'
      ) || [];

      setMessageCount(tenantMessages.length);
    } catch (error) {
      console.error('Error fetching message count:', error);
      setMessageCount(0);
    }
  }, []);

  // Fetch authenticated user and initial data on mount
  useEffect(() => {
    const initializeData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchProperties();
        fetchPendingResetCount();
        fetchMaintenanceRequests();
        fetchMaintenanceCount();
        fetchMessageCount();
      }
    };
    
    initializeData();
  }, [fetchProperties, fetchPendingResetCount, fetchMaintenanceRequests, fetchMaintenanceCount, fetchMessageCount]);

  // Set up real-time listener for tenant profile updates
  useEffect(() => {
    const channel = supabase
      .channel('property-owner-room-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms'
        },
        async (payload) => {
          console.log('Room/tenant profile updated:', payload);
          
          // Refresh all properties data from database
          await fetchProperties();
          
          toast({
            title: "Tenant Profile Updated",
            description: "A tenant profile has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProperties, toast]);

  // Set up real-time listener for maintenance requests
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'content=ilike.*MAINTENANCE REQUEST*'
      }, () => {
        fetchMaintenanceRequests();
        fetchMaintenanceCount();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        // Check if it's a maintenance request message
        if (payload.new.content?.includes('MAINTENANCE REQUEST')) {
          console.log('Maintenance request updated:', payload);
          fetchMaintenanceRequests();
          fetchMaintenanceCount();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMaintenanceRequests, fetchMaintenanceCount]);

  // Set up real-time listener for new messages
  useEffect(() => {
    const setupMessageListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('owner-message-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          async (payload) => {
            // Check if it's NOT a maintenance request
            if (!payload.new.content?.includes('MAINTENANCE REQUEST')) {
              console.log('New message received:', payload);
              
              // Fetch sender details to show in toast
              const { data: sender } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', payload.new.sender_id)
                .single();

              // Only show notification for tenant messages
              if (sender?.role === 'tenant') {
                toast({
                  title: "New Message 📨",
                  description: `You have a new message from ${sender.full_name}`,
                  duration: 5000,
                });
                
                fetchMessageCount();
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupMessageListener();
  }, [toast, fetchMessageCount]);

  // Add visibility change listener to refresh data when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing properties');
        fetchProperties();
        fetchPendingResetCount();
        fetchMaintenanceRequests();
        fetchMaintenanceCount();
        fetchMessageCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchProperties, fetchPendingResetCount, fetchMaintenanceRequests, fetchMaintenanceCount, fetchMessageCount]);

  // Set up real-time listener for password reset requests
  useEffect(() => {
    const channel = supabase
      .channel('password-reset-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'password_reset_requests'
        },
        (payload) => {
          console.log('New password reset request:', payload);
          
          // Only show notification for tenant/manager/agent requests (not owner)
          const role = payload.new.user_role;
          if (role === 'tenant' || role === 'manager' || role === 'agent') {
            toast({
              title: "New Password Reset Request",
              description: `${payload.new.email} (${role}) has requested a password reset.`,
              duration: 6000,
            });
            
            fetchPendingResetCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'password_reset_requests'
        },
        (payload) => {
          console.log('Password reset request updated:', payload);
          // Refresh count when status changes
          fetchPendingResetCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleAddProperty = () => {
    setIsAddPropertyModalOpen(true);
  };

  const handleAddPropertySubmit = async (newProperty: Property) => {
    // Refresh properties list to get accurate data from database
    await fetchProperties();
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsEditPropertyModalOpen(true);
  };

  const handleUpdateProperty = async (updatedProperty: Property) => {
    // Refresh properties from database to get accurate data
    await fetchProperties();
    
    toast({
      title: "Property Updated",
      description: `${updatedProperty.name} has been updated successfully.`,
    });
  };

  const handleOpenSheet = () => {
    window.open("https://docs.google.com/spreadsheets/d/1zi_wSIlvUlOoaJH9kcn1DjbzJnnHi8a1tOUps2z3BK4/edit?gid=0#gid=0", "_blank");
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    toast({
      title: "Message Sent",
      description: `Message sent to ${selectedRecipient === "all" ? "all tenants" : selectedRecipient}`,
    });
    setMessageText("");
  };

  const handleInviteManager = () => {
    setIsInviteManagerOpen(true);
  };

  const handleInviteAgent = () => {
    setIsInviteAgentOpen(true);
  };

  const handleManagerInvited = async (managerData: {
    email: string;
    password: string;
    scope: 'all' | 'single';
    propertyId?: string;
    propertyName?: string;
  }) => {
    try {
      // Create the auth user, profile, role and property assignment in one step
      const { data, error: authError } = await supabase.functions.invoke('create-invited-user', {
        body: {
          email: managerData.email.trim().toLowerCase(),
          password: managerData.password,
          role: 'manager',
          property_id: managerData.scope === 'single' ? managerData.propertyId : null,
          room_id: null
        }
      });

      if (authError) throw authError;
      if (data?.error) throw new Error(data.error);

      console.log('Manager account created successfully');

      toast({
        title: "Manager Invited Successfully",
        description: `Account created for ${managerData.propertyName || 'all properties'}. Manager can login immediately.`,
      });
    } catch (error: any) {
      console.error('Error inviting manager:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleAgentInvited = async (agentData: {
    email: string;
    password: string;
    scope: 'all' | 'single';
    propertyId?: string;
    propertyName?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate invitation credentials
      const { data: invitationData, error: invitationError } = await (supabase
        .rpc as any)('generate_invitation_credentials', {
          invitation_email: agentData.email,
          invitation_role: 'agent',
          invitation_property_id: agentData.scope === 'single' ? agentData.propertyId : null,
          invitation_room_id: null,
        });

      if (invitationError) throw invitationError;

      // Call edge function to create the user account
      const { data, error } = await supabase.functions.invoke('create-invited-user', {
        body: {
          email: agentData.email,
          password: agentData.password,
          role: 'agent',
          property_id: agentData.scope === 'single' ? agentData.propertyId : null
        }
      });

      if (error) throw error;

      const scopeDescription = agentData.scope === 'all'
        ? 'all properties'
        : `${agentData.propertyName}`;

      toast({
        title: "Agent Invited Successfully",
        description: `Agent has been assigned to ${scopeDescription}.`,
      });

      setIsInviteAgentOpen(false);
    } catch (error) {
      console.error('Error inviting agent:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = () => {
    setIsDocumentReportOpen(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProperty = async () => {
    if (propertyToDelete) {
      try {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', propertyToDelete);

        if (error) throw error;

        setProperties(properties.filter(p => p.id !== propertyToDelete));
        toast({
          title: "Property Deleted",
          description: "Property has been removed successfully.",
        });
      } catch (error) {
        console.error("Error deleting property:", error);
        toast({
          title: "Error",
          description: "Failed to delete property. Please try again.",
          variant: "destructive",
        });
      }
    }
    setDeleteConfirmOpen(false);
    setPropertyToDelete(null);
  };

  const handleViewRooms = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setIsRoomManagementOpen(true);
    }
  };

  const handleApproveMaintenanceRequest = async (messageId: string, propertyName: string, roomNumber: string) => {
    setApprovingRequestId(messageId);
    try {
      const message = maintenanceMessages.find(m => m.id === messageId);
      if (!message) {
        toast({
          title: "Error",
          description: "Message not found",
          variant: "destructive",
        });
        return;
      }

      const updatedContent = updateMaintenanceStatus(message.fullContent, 'Approved');

      console.log('Approving maintenance request:', {
        messageId,
        oldContent: message.fullContent.substring(0, 100),
        newContent: updatedContent.substring(0, 100)
      });

      const { error } = await supabase
        .from('messages')
        .update({ content: updatedContent })
        .eq('id', messageId);

      if (error) {
        console.error('Error approving maintenance request:', error);
        throw error;
      }

      toast({
        title: "Request Approved ✓",
        description: `Maintenance request approved for ${propertyName} - Room ${roomNumber}`,
      });

      // Force refresh the maintenance requests
      await fetchMaintenanceRequests();
    } catch (error) {
      console.error('Error in handleApproveMaintenanceRequest:', error);
      toast({
        title: "Error",
        description: "Failed to approve maintenance request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleOpenMaintenance = () => {
    setIsMaintenanceOpen(true);
    setMaintenanceCount(0);
  };

  const handleOpenMessageCenter = () => {
    setIsMessageCenterOpen(true);
    setMessageCount(0);
  };

  const handlePasswordReset = () => {
    setIsPasswordResetOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          onOpenSheet={handleOpenSheet}
          onOpenMaintenance={handleOpenMaintenance}
          onOpenMessageCenter={handleOpenMessageCenter}
          onGenerateReport={handleGenerateReport}
          onPasswordReset={handlePasswordReset}
          onInviteManager={handleInviteManager}
          onInviteAgent={handleInviteAgent}
          onViewLeaseAgreements={() => setIsLeaseAgreementsOpen(true)}
          onAddProperty={handleAddProperty}
          userRole="owner"
          pendingResetCount={pendingResetCount}
          maintenanceCount={maintenanceCount}
          messageCount={messageCount}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Blue Header Bar */}
          <div className="w-full h-16 bg-blue-900 flex items-center px-6">
            <SidebarTrigger className="mr-4 text-white hover:bg-blue-800" />
            <h1 className="text-white text-2xl font-bold">KaaSmart Property Management</h1>
          </div>

          <div className="flex-1 bg-gradient-earth p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Property Owner Dashboard</h1>
                  <p className="text-muted-foreground">Manage your properties with ease</p>
                </div>
              </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Active properties</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Home className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">Across all properties</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{occupiedRooms}</div>
              <p className="text-xs text-muted-foreground">Currently rented</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacant Rooms</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{vacantRooms}</div>
              <p className="text-xs text-muted-foreground">Available for rent</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">Overall occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Properties</h2>
            <Badge variant="secondary" className="text-sm">
              {properties.length} Properties
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-2 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No properties found. Add your first property to get started.</p>
              </div>
            ) : (
              properties.map((property) => (
              <Card key={property.id} className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card hover:shadow-warm transition-all duration-300 overflow-hidden group">
                <div className="relative">
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {property.occupiedRooms}/{property.total_rooms} Occupied
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {property.location}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Rooms</span>
                      <span className="text-sm font-medium">{property.total_rooms}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rent Per Room</span>
                      <span className="text-lg font-bold text-primary">
                        KSh {property.rent_per_room.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <span className="text-sm font-medium">
                        {((property.occupiedRooms / property.total_rooms) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-hero h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(property.occupiedRooms / property.total_rooms) * 100}%`,
                        }}
                      />
                     </div>
                     
                     <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-hero hover:shadow-glow"
                        onClick={() => handleViewRooms(property.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Rooms
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditProperty(property)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>

        <RoomDetailsModal
          property={selectedProperty}
          isOpen={isRoomModalOpen}
          onClose={() => {
            setIsRoomModalOpen(false);
            setSelectedProperty(null);
          }}
        />

        <RoomManagementModal
          property={selectedProperty}
          isOpen={isRoomManagementOpen}
          onClose={() => {
            setIsRoomManagementOpen(false);
            setSelectedProperty(null);
          }}
          userRole="owner"
        />

      <AddPropertyModal 
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onAddProperty={handleAddPropertySubmit}
      />

      <EditPropertyModal
        isOpen={isEditPropertyModalOpen}
        onClose={() => setIsEditPropertyModalOpen(false)}
        property={selectedProperty}
        onUpdateProperty={handleUpdateProperty}
      />

        <ReportModal
          properties={properties}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />

        <DocumentReport
          properties={properties}
          isOpen={isDocumentReportOpen}
          onClose={() => setIsDocumentReportOpen(false)}
        />

        <InviteManagerModal
          isOpen={isInviteManagerOpen}
          onClose={() => setIsInviteManagerOpen(false)}
          properties={properties.map(p => ({ id: p.id, name: p.name, location: p.location }))}
          onManagerInvited={handleManagerInvited}
        />

        <InviteAgentModal
          isOpen={isInviteAgentOpen}
          onClose={() => setIsInviteAgentOpen(false)}
          properties={properties.map(p => ({ id: p.id, name: p.name, location: p.location }))}
          onAgentInvited={handleAgentInvited}
        />

        <PasswordResetRequestsSheet
          open={isPasswordResetOpen}
          onOpenChange={setIsPasswordResetOpen}
          onRequestsUpdated={fetchPendingResetCount}
          userRole="owner"
        />

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this property? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteProperty} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

            </div>
          </div>

          <AppFooter />
        </div>

        {/* Maintenance Sheet */}
        <Sheet open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
          <SheetContent className="w-[600px] sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>Maintenance Requests</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {maintenanceMessages.length > 0 ? (
                maintenanceMessages.map((msg) => (
                  <div key={msg.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPriorityVariant(msg.priority as any)}>
                            {msg.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <Badge variant="outline">{msg.category.charAt(0).toUpperCase() + msg.category.slice(1)}</Badge>
                          <Badge variant={getStatusVariant(msg.status)}>
                            {msg.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                        <p className="text-sm font-semibold text-primary">
                          {msg.property} - {msg.room.charAt(0).toUpperCase() + msg.room.slice(1)}
                        </p>
                          <p className="text-sm text-muted-foreground">
                            Tenant: {msg.tenant}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm border-t pt-2">{msg.message}</p>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      {msg.status === 'Pending Review' ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveMaintenanceRequest(msg.id, msg.property, msg.room)}
                          className="bg-gradient-hero hover:shadow-glow"
                          disabled={approvingRequestId === msg.id}
                        >
                          {approvingRequestId === msg.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            'Approve Request'
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Status: {msg.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No maintenance requests</p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Message Center Dialog */}
        <Dialog open={isMessageCenterOpen} onOpenChange={setIsMessageCenterOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Message Center
              </DialogTitle>
              <DialogDescription>
                View and send messages to your tenants and staff
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              {currentUserId && (
                <MessageCenter
                  currentUserId={currentUserId}
                  currentUserRole="owner"
                  properties={properties}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Lease Agreements Sheet */}
        <Sheet open={isLeaseAgreementsOpen} onOpenChange={setIsLeaseAgreementsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Lease Agreements</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AllLeaseDocumentsViewer />
            </div>
          </SheetContent>
        </Sheet>

        {/* AI Chatbot */}
        {currentUserId && (
          <RoleChatbot
            role="owner"
            userId={currentUserId}
            userName="Property Owner"
            position="bottom-right"
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default PropertyOwnerDashboard;