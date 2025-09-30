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
        (payload) => {
          console.log('Room/tenant profile updated:', payload);
          
          // Update properties with new tenant data
          setProperties(prevProperties => 
            prevProperties.map(property => {
              const updatedRoom = payload.new;
              if (updatedRoom.property_id === property.id) {
                toast({
                  title: "Tenant Profile Updated",
                  description: `A tenant profile in ${property.name} has been updated.`,
                });
              }
              return property;
            })
          );
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

  return (
    <div className="min-h-screen bg-gradient-earth">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md shadow-card">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            KaaSmart Property Management
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Dashboard Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
            <p className="text-muted-foreground">Manage properties and assist tenants</p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Active properties</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Home className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">Across all properties</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{occupiedRooms}</div>
              <p className="text-xs text-muted-foreground">Currently rented</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacant Rooms</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{vacantRooms}</div>
              <p className="text-xs text-muted-foreground">Available for rent</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-sm hover:shadow-md transition-shadow">
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

        {/* Properties Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight">Managed Properties</h3>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary/95 text-primary-foreground shadow-lg">
                      {property.occupiedRooms}/{property.total_rooms} Occupied
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">{property.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {property.location}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Total rooms</p>
                      <p className="text-lg font-semibold">{property.total_rooms}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Occupancy</p>
                      <p className="text-lg font-semibold">
                        {((property.occupiedRooms / property.total_rooms) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Rent per room</span>
                      <span className="text-xl font-bold text-primary">
                        KSh {property.rent_per_room.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-hero h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(property.occupiedRooms / property.total_rooms) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {property.occupiedRooms} of {property.total_rooms} rooms occupied
                      </p>
                    </div>
                  </div>
                     
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-hero hover:shadow-glow transition-all"
                      onClick={() => handleViewRooms(property.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Rooms
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

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


      </main>
    </div>
  );
};

export default ManagerDashboard;