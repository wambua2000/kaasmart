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
      {/* Enhanced Header Bar with gradient */}
      <div className="w-full h-20 bg-gradient-hero flex items-center px-8 shadow-glow">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">KaaSmart</h1>
            <p className="text-white/80 text-sm">Property Management</p>
          </div>
        </div>
      </div>
      
      <div className="px-8 py-10">
        <div className="max-w-7xl mx-auto">
        
          {/* Enhanced Header with animated background */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-hero/5 rounded-3xl -z-10"></div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-8 rounded-3xl bg-card/60 backdrop-blur-md border border-border/50 shadow-card">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-hero bg-clip-text text-transparent">
                  Property Owner Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">Manage your properties with ease and efficiency</p>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground">Live Updates Active</span>
                  </div>
                </div>
              </div>
            <div className="flex items-center gap-3 flex-wrap">
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
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="group bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-md border-border/50 shadow-card hover:shadow-warm transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Active properties</p>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-md border-border/50 shadow-card hover:shadow-warm transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Home className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-1">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">Across all properties</p>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-md border-border/50 shadow-card hover:shadow-warm transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Occupied Rooms</CardTitle>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">{occupiedRooms}</div>
              <p className="text-xs text-muted-foreground">Currently rented</p>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-md border-border/50 shadow-card hover:shadow-warm transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vacant Rooms</CardTitle>
              <div className="w-10 h-10 bg-muted/20 rounded-lg flex items-center justify-center group-hover:bg-muted/30 transition-colors">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground mb-1">{vacantRooms}</div>
              <p className="text-xs text-muted-foreground">Available for rent</p>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-md border-border/50 shadow-card hover:shadow-warm transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">Overall occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Properties Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Your Properties</h2>
              <p className="text-muted-foreground">Manage and monitor all your property investments</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              {properties.length} Properties
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <Card key={property.id} className="group bg-gradient-to-br from-card via-card/95 to-card/80 backdrop-blur-md border-border/50 shadow-card hover:shadow-glow transition-all duration-500 overflow-hidden hover:scale-[1.02] hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-lg">
                      {property.occupiedRooms}/{property.total_rooms} Occupied
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {property.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {property.location}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold text-foreground">{property.total_rooms}</div>
                      <div className="text-xs text-muted-foreground">Total Rooms</div>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {((property.occupiedRooms / property.total_rooms) * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Occupancy</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                      <span className="text-xl font-bold text-primary">
                        KSh {(property.occupiedRooms * property.rent_per_room).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rent per room</span>
                      <span className="text-sm font-medium text-foreground">
                        KSh {property.rent_per_room.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Occupancy Progress</span>
                      <span className="font-medium">{property.occupiedRooms}/{property.total_rooms}</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-hero h-full rounded-full transition-all duration-700 shadow-sm relative"
                        style={{
                          width: `${(property.occupiedRooms / property.total_rooms) * 100}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                      
                  <div className="flex gap-3 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-hero hover:shadow-glow hover:scale-105 transition-all duration-300"
                      onClick={() => handleViewRooms(property.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Rooms
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="hover:scale-105 transition-all duration-300"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

        </div>
      </div>
    </div>
  );
};

export default PropertyOwnerDashboard;