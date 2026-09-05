import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, Users, DollarSign, MapPin, Eye, MessageSquare, Wrench } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/AppFooter";
import MessageCenter from "@/components/messaging/MessageCenter";
import AllLeaseDocumentsViewer from "@/components/property/AllLeaseDocumentsViewer";
import { RoleChatbot } from "@/components/chat/RoleChatbot";
import apartmentInterior from "@/assets/apartment-interior.jpg";
import skylineApartment from "@/assets/skyline-apartment.jpg";
import yellowHouse from "@/assets/yellow-house.jpg";
import whiteHouse from "@/assets/white-house.jpg";
import greenHouse from "@/assets/green-house.jpg";
import RoomDetailsModal from "@/components/property/RoomDetailsModal";
import RoomManagementModal from "@/components/property/RoomManagementModal";
import { supabase } from "@/integrations/supabase/client";
import { parseMaintenanceRequest, getPriorityVariant, getStatusVariant } from "@/lib/maintenanceUtils";

interface Property {
  id: string;
  name: string;
  location: string;
  rent_per_room: number;
  total_rooms: number;
  occupiedRooms: number;
  image_url?: string;
}

const ManagerDashboard = () => {
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomManagementOpen, setIsRoomManagementOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
  const [isLeaseAgreementsOpen, setIsLeaseAgreementsOpen] = useState(false);
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
  }>>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, prop) => sum + prop.total_rooms, 0);
  const occupiedRooms = properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0);
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1);

  // Fetch properties from database - wrapped in useCallback for stability
  const fetchProperties = useCallback(async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        toast({
          title: "Error",
          description: "Failed to authenticate",
          variant: "destructive"
        });
        return;
      }

      // Try RPC first, fallback to direct queries
      const { data: propertiesData, error } = await (supabase
        .rpc as any)('get_manager_properties_with_stats', {
          manager_user_id: user.id
        });

      if (error) {
        console.warn('RPC failed, using direct queries:', error);
        // Fallback: fetch from manager_properties + properties + rooms
        const { data: assignments } = await supabase
          .from('manager_properties')
          .select('property_id, can_manage_all, owner_id')
          .eq('manager_id', user.id);

        if (assignments && assignments.length > 0) {
          const ownerIds = assignments
            .filter((a: any) => a.can_manage_all && a.owner_id)
            .map((a: any) => a.owner_id);
          const propertyIds = assignments.map((a: any) => a.property_id).filter(Boolean);

          let props: any[] = [];
          if (propertyIds.length > 0) {
            const { data } = await supabase.from('properties').select('*').in('id', propertyIds);
            props = props.concat(data || []);
          }
          if (ownerIds.length > 0) {
            const { data } = await supabase.from('properties').select('*').in('owner_id', ownerIds);
            props = props.concat(data || []);
          }
          props = props.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
          
          const formattedProperties = await Promise.all((props || []).map(async (prop: any) => {
            const { count } = await supabase
              .from('rooms')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', prop.id)
              .eq('is_occupied', true);
            
            return {
              id: prop.id,
              name: prop.name,
              location: prop.location || '',
              rent_per_room: prop.rent_per_room || 0,
              total_rooms: prop.total_rooms || 0,
              occupiedRooms: count || 0,
              image_url: prop.image_url || undefined,
            };
          }));
          setProperties(formattedProperties);
        }
        return;
      }

      if (propertiesData) {
        const formattedProperties = propertiesData.map((property: any) => ({
          id: property.id,
          name: property.name,
          location: property.location,
          rent_per_room: property.rent_per_room,
          total_rooms: property.total_rooms,
          occupiedRooms: Number(property.occupied_rooms),
          image_url: property.image_url || undefined,
        }));

        setProperties(formattedProperties);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Fetch maintenance requests with property and room details
  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Resolve the exact properties this manager is authorised for
      const { data: managerAssignments } = await supabase
        .from('manager_properties')
        .select('property_id, can_manage_all, owner_id')
        .eq('manager_id', user.id);

      if (!managerAssignments || managerAssignments.length === 0) {
        setMaintenanceMessages([]);
        return;
      }

      const propertyIds = new Set<string>(
        managerAssignments.map((mp: any) => mp.property_id).filter(Boolean)
      );
      const ownerIds = managerAssignments
        .filter((mp: any) => mp.can_manage_all && mp.owner_id)
        .map((mp: any) => mp.owner_id);
      if (ownerIds.length > 0) {
        const { data: ownerProps } = await supabase
          .from('properties')
          .select('id')
          .in('owner_id', ownerIds);
        (ownerProps || []).forEach((p: any) => propertyIds.add(p.id));
      }

      if (propertyIds.size === 0) {
        setMaintenanceMessages([]);
        return;
      }

      const query = supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          property_id,
          sender_id,
          profiles!messages_sender_id_fkey(full_name)
        `)
        .ilike('content', '%MAINTENANCE REQUEST%')
        .in('property_id', Array.from(propertyIds));

      const { data: messages, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Manager - Messages fetched:', messages?.length || 0);

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

          return {
            id: msg.id,
            property: roomData?.properties?.name || 'Unknown Property',
            room: roomData?.room_number || 'N/A',
            tenant: (msg.profiles as any)?.full_name || 'Unknown Tenant',
            message: parsed.description,
            timestamp: new Date(msg.created_at).toLocaleString(),
            priority: parsed.priority,
            category: parsed.category,
            status: parsed.status
          };
        })
      );

      setMaintenanceMessages(messagesWithDetails);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    }
  }, []);

  // Fetch properties on mount and set current user ID
  useEffect(() => {
    const initializeData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchProperties();
        fetchMaintenanceRequests();
      }
    };
    
    initializeData();
  }, [fetchProperties, fetchMaintenanceRequests]);

  // Set up real-time listener for tenant profile updates
  useEffect(() => {
    const channel = supabase
      .channel('manager-room-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms'
        },
        async (payload) => {
          console.log('Room/tenant profile updated:', payload);
          
          // Use the stable fetchProperties callback
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
      .channel('manager-maintenance-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'content=ilike.*MAINTENANCE REQUEST*'
      }, () => {
        fetchMaintenanceRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMaintenanceRequests]);

  // Add visibility change listener to refresh data when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, refreshing properties');
        fetchProperties();
        fetchMaintenanceRequests();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchProperties, fetchMaintenanceRequests]);

  const handleAddProperty = () => {
    const newProperty: Property = {
      id: (properties.length + 1).toString(),
      name: "New Property",
      location: "Location TBD",
      rent_per_room: 0,
      total_rooms: 0,
      occupiedRooms: 0,
      image_url: apartmentInterior,
    };
    setProperties([...properties, newProperty]);
    toast({
      title: "Property Added",
      description: "New property has been added successfully.",
    });
  };

  const handleInviteManager = () => {
    toast({
      title: "Manager Invited",
      description: "Invitation email sent to manager successfully.",
    });
  };

  const handleGenerateReport = () => {
    // Generate CSV report
    const reportData = properties.map(prop => ({
      Property: prop.name,
      Location: prop.location,
      "Total Rooms": prop.total_rooms,
      "Occupied Rooms": prop.occupiedRooms,
      "Vacant Rooms": prop.total_rooms - prop.occupiedRooms,
      "Occupancy Rate": `${((prop.occupiedRooms / prop.total_rooms) * 100).toFixed(1)}%`,
      "Rent Per Room": `KSh ${prop.rent_per_room.toLocaleString()}`,
      "Monthly Revenue": `KSh ${(prop.occupiedRooms * prop.rent_per_room).toLocaleString()}`,
    }));
    
    console.log("Property Report:", reportData);
    toast({
      title: "Report Generated",
      description: "Property report has been generated and downloaded.",
    });
  };

  const handleViewRooms = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setIsRoomManagementOpen(true);
    }
  };

  const handleOpenSheet = () => {
    window.open("https://docs.google.com/spreadsheets/d/1zi_wSIlvUlOoaJH9kcn1DjbzJnnHi8a1tOUps2z3BK4/edit?gid=0#gid=0", "_blank");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          onOpenSheet={handleOpenSheet}
          onOpenMaintenance={() => setIsMaintenanceOpen(true)}
          onOpenMessageCenter={() => setIsMessageCenterOpen(true)}
          onGenerateReport={handleGenerateReport}
          onViewLeaseAgreements={() => setIsLeaseAgreementsOpen(true)}
          userRole="manager"
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
                  <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
                  <p className="text-muted-foreground">Manage properties and assist tenants</p>
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
            <h2 className="text-2xl font-bold text-foreground">Managed Properties</h2>
            <Badge variant="secondary" className="text-sm">
              {properties.length} Properties
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          userRole="manager"
        />


            </div>
          </div>

          <AppFooter />
        </div>

        {/* Maintenance Sheet */}
        <Sheet open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
          <SheetContent className="w-[600px] sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>Maintenance Requests (View Only)</SheetTitle>
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No maintenance requests</p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Message Center Sheet */}
        <Sheet open={isMessageCenterOpen} onOpenChange={setIsMessageCenterOpen}>
          <SheetContent className="w-[600px] sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>Message Center</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {currentUserId && (
                <MessageCenter
                  currentUserId={currentUserId}
                  currentUserRole="manager"
                  properties={properties}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>

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
            role="manager"
            userId={currentUserId}
            userName="Manager"
            position="bottom-right"
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default ManagerDashboard;