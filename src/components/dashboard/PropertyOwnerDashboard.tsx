import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, Users, DollarSign, Plus, MapPin, Mail, FileText, Settings, ExternalLink, Wrench, MessageSquare, Eye, Trash2 } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MessageCenter from "@/components/messaging/MessageCenter";
import apartmentInterior from "@/assets/apartment-interior.jpg";
import skylineApartment from "@/assets/skyline-apartment.jpg";
import yellowHouse from "@/assets/yellow-house.jpg";
import whiteHouse from "@/assets/white-house.jpg";
import greenHouse from "@/assets/green-house.jpg";
import RoomDetailsModal from "@/components/property/RoomDetailsModal";
import AddPropertyModal from "@/components/property/AddPropertyModal";
import RoomManagementModal from "@/components/property/RoomManagementModal";
import ReportModal from "@/components/property/ReportModal";
import DocumentReport from "@/components/property/DocumentReport";
import InviteManagerModal from "@/components/manager/InviteManagerModal";
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

const PropertyOwnerDashboard = () => {
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isRoomManagementOpen, setIsRoomManagementOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDocumentReportOpen, setIsDocumentReportOpen] = useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [maintenanceMessages, setMaintenanceMessages] = useState<Array<{id: string, property: string, room: string, tenant: string, message: string, timestamp: string}>>([]);
  const [messageText, setMessageText] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
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
      .channel('property-owner-room-updates')
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
              // Find if any rooms in this property were updated
              const updatedRoom = payload.new;
              if (updatedRoom.property_id === property.id) {
                // This would ideally refresh room data from the database
                // For now, we'll show a toast notification
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
    setIsAddPropertyModalOpen(true);
  };

  const handleAddPropertySubmit = (newProperty: Property) => {
    setProperties([...properties, newProperty]);
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

  const handleManagerInvited = (managerData: {
    email: string;
    password: string;
    scope: 'all' | 'single';
    propertyId?: string;
    propertyName?: string;
  }) => {
    // Store manager credentials in localStorage
    const existingCredentials = JSON.parse(localStorage.getItem('managerCredentials') || '[]');
    const newCredentials = [...existingCredentials, managerData];
    localStorage.setItem('managerCredentials', JSON.stringify(newCredentials));
    
    toast({
      title: "Manager Invited Successfully",
      description: `Manager credentials generated for ${managerData.propertyName || 'selected scope'}`,
    });
  };

  const handleGenerateReport = () => {
    setIsDocumentReportOpen(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProperty = () => {
    if (propertyToDelete) {
      setProperties(properties.filter(p => p.id !== propertyToDelete));
      toast({
        title: "Property Deleted",
        description: "Property has been removed successfully.",
      });
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
            <h2 className="text-3xl font-bold tracking-tight">Property Owner Dashboard</h2>
            <p className="text-muted-foreground">Manage your properties with ease</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleOpenSheet} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Sheet
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Wrench className="mr-2 h-4 w-4" />
                  Maintenance
                </Button>
              </SheetTrigger>
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
                    currentUserId="mock-owner-id"
                    currentUserRole="owner"
                    properties={properties}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={handleGenerateReport} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button onClick={handleInviteManager} variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Invite Manager
            </Button>
            <Button onClick={handleAddProperty} className="bg-gradient-hero hover:shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
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
            <h3 className="text-2xl font-bold tracking-tight">Your Properties</h3>
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
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
          userRole="owner"
        />

        <AddPropertyModal
          isOpen={isAddPropertyModalOpen}
          onClose={() => setIsAddPropertyModalOpen(false)}
          onAddProperty={handleAddPropertySubmit}
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
          properties={properties.map(p => ({ id: p.id, name: p.name }))}
          onManagerInvited={handleManagerInvited}
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

      </main>
    </div>
  );
};

export default PropertyOwnerDashboard;