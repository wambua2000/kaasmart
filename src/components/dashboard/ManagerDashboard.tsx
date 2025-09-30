import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, Users, DollarSign, MapPin, Eye, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import MessageCenter from "@/components/messaging/MessageCenter";
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
  const [maintenanceMessages, setMaintenanceMessages] = useState<Array<{id: string, property: string, room: string, tenant: string, message: string, timestamp: string}>>([]);
  const [properties, setProperties] = useState<Property[]>([
    {
      id: "1",
      name: "Skyline Apartment",
      location: "Nairobi West, Nairobi",
      rent_per_room: 15000,
      total_rooms: 50,
      occupiedRooms: 42,
      image_url: skylineApartment,
    },
    {
      id: "2",
      name: "Yellow House",
      location: "Mombasa Road, Nairobi", 
      rent_per_room: 18000,
      total_rooms: 20,
      occupiedRooms: 18,
      image_url: yellowHouse,
    },
    {
      id: "3",
      name: "White House",
      location: "Kisumu CBD, Kisumu",
      rent_per_room: 12000,
      total_rooms: 20,
      occupiedRooms: 16,
      image_url: whiteHouse,
    },
    {
      id: "4",
      name: "Green House",
      location: "Nakuru Town, Nakuru",
      rent_per_room: 14000,
      total_rooms: 20,
      occupiedRooms: 17,
      image_url: greenHouse,
    },
  ]);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, prop) => sum + prop.total_rooms, 0);
  const occupiedRooms = properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0);
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1);

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
          const updatedRoom = payload.new;
          
          // Find which property this room belongs to
          const affectedProperty = properties.find(p => p.id === updatedRoom.property_id);
          
          if (affectedProperty) {
            // Refresh occupied rooms count from database
            const { data: roomsData } = await supabase
              .from('rooms')
              .select('id, is_occupied')
              .eq('property_id', affectedProperty.id);

            if (roomsData) {
              const occupiedCount = roomsData.filter(r => r.is_occupied).length;
              
              setProperties(prevProperties =>
                prevProperties.map(property =>
                  property.id === affectedProperty.id
                    ? { ...property, occupiedRooms: occupiedCount }
                    : property
                )
              );
            }

            toast({
              title: "Tenant Profile Updated",
              description: `A tenant profile in ${affectedProperty.name} has been synced.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [properties, toast]);

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

  return (
    <div className="min-h-screen">
      {/* Blue Header Bar covering full width */}
      <div className="w-full h-16 bg-blue-600 flex items-center px-6">
        <h1 className="text-white text-2xl font-bold">KaaSmart Property Management</h1>
      </div>
      <div className="bg-gradient-earth p-6">
        <div className="max-w-7xl mx-auto">
        
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
              <p className="text-muted-foreground">Manage properties and assist tenants</p>
            </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Center
                </Button>
              </SheetTrigger>
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
    </div>
  );
};

export default ManagerDashboard;