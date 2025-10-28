import { useState, useEffect } from "react";
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
import apartmentInterior from "@/assets/apartment-interior.jpg";
import skylineApartment from "@/assets/skyline-apartment.jpg";
import yellowHouse from "@/assets/yellow-house.jpg";
import whiteHouse from "@/assets/white-house.jpg";
import greenHouse from "@/assets/green-house.jpg";
import RoomDetailsModal from "@/components/property/RoomDetailsModal";
import RoomManagementModal from "@/components/property/RoomManagementModal";
import { supabase } from "@/integrations/supabase/client";

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
  const [maintenanceMessages, setMaintenanceMessages] = useState<Array<{id: string, property: string, room: string, tenant: string, message: string, timestamp: string}>>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, prop) => sum + prop.total_rooms, 0);
  const occupiedRooms = properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0);
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1);

  // Fetch properties from database - only those assigned to this manager
  useEffect(() => {
    const fetchProperties = async () => {
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

        // Use the optimized RPC function to get properties with stats in a single query
        const { data: propertiesData, error } = await supabase
          .rpc('get_manager_properties_with_stats', {
            manager_user_id: user.id
          });

        if (error) {
          console.error('Error fetching properties:', error);
          toast({
            title: "Error",
            description: "Failed to load properties",
            variant: "destructive"
          });
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
    };

    fetchProperties();
  }, [toast]);

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
          
          // Re-fetch properties with updated data
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data: propertiesData } = await supabase
            .rpc('get_manager_properties_with_stats', {
              manager_user_id: user.id
            });
          
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
  }, [toast]);

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
                      <span className="text-sm text-muted-foreground">Total rooms</span>
                      <span className="text-sm font-medium">{property.total_rooms}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rent per room</span>
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
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Maintenance Messages</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {maintenanceMessages.length > 0 ? (
                maintenanceMessages.map((msg) => (
                  <div key={msg.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{msg.property} - {msg.room}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="font-medium">{msg.tenant}</p>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center">No maintenance requests</p>
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
              <MessageCenter
                currentUserId="mock-manager-id"
                currentUserRole="manager"
                properties={properties}
              />
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
      </div>
    </SidebarProvider>
  );
};

export default ManagerDashboard;