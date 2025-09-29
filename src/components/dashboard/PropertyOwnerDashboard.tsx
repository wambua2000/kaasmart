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
import { supabase } from "@/integrations/supabase/client";
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

interface Property {
  id: string;
  name: string;
  location: string;
  rentPerRoom: number;
  totalRooms: number;
  occupiedRooms: number;
  image: string;
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch properties and rooms from database
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: propertiesData, error: propError } = await supabase
        .from('properties')
        .select('*');

      if (propError) throw propError;

      if (propertiesData) {
        // For each property, get room count and occupancy
        const propertiesWithRooms = await Promise.all(
          propertiesData.map(async (property) => {
            const { data: roomsData, error: roomsError } = await supabase
              .from('rooms')
              .select('*')
              .eq('property_id', property.id);

            if (roomsError) throw roomsError;

            const totalRooms = roomsData?.length || 0;
            const occupiedRooms = roomsData?.filter(room => room.is_occupied).length || 0;

            // Map to Property interface with image fallback
            const imageMap: { [key: string]: string } = {
              'Skyline Apartment': skylineApartment,
              'Yellow House': yellowHouse,
              'White House': whiteHouse,
              'Green House': greenHouse,
            };

            return {
              id: property.id,
              name: property.name,
              location: property.location,
              rentPerRoom: Number(property.rent_per_room),
              totalRooms,
              occupiedRooms,
              image: imageMap[property.name] || apartmentInterior,
            };
          })
        );

        setProperties(propertiesWithRooms);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, prop) => sum + prop.totalRooms, 0);
  const occupiedRooms = properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0);
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : "0";

  const handleAddProperty = () => {
    setIsAddPropertyModalOpen(true);
  };

  const handleAddPropertySubmit = (newProperty: Property) => {
    setProperties([...properties, newProperty]);
    fetchProperties(); // Refresh to get accurate data
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

  // Refresh data when room management modal closes (to update occupancy)
  const handleRoomManagementClose = () => {
    setIsRoomManagementOpen(false);
    setSelectedProperty(null);
    fetchProperties(); // Refresh to get updated occupancy data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-earth flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-foreground">Property Owner Dashboard</h1>
              <p className="text-muted-foreground">Manage your properties with ease</p>
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
                  Message All
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Send Message</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Send to:</Label>
                    <select 
                      id="recipient"
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="all">All Tenants</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.name}>{property.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message:</Label>
                    <Textarea
                      id="message"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleSendMessage} className="w-full">
                    Send Message
                  </Button>
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
            {properties.map((property) => (
              <Card key={property.id} className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card hover:shadow-warm transition-all duration-300 overflow-hidden group">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {property.occupiedRooms}/{property.totalRooms} Occupied
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
                      <span className="text-sm font-medium">{property.totalRooms}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rent per room</span>
                      <span className="text-lg font-bold text-primary">
                        KSh {property.rentPerRoom.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <span className="text-sm font-medium">
                        {property.totalRooms > 0 ? ((property.occupiedRooms / property.totalRooms) * 100).toFixed(0) : 0}%
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-hero h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${property.totalRooms > 0 ? (property.occupiedRooms / property.totalRooms) * 100 : 0}%`,
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
                        variant="destructive"
                        onClick={() => handleDeleteProperty(property.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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

        <AddPropertyModal
          isOpen={isAddPropertyModalOpen}
          onClose={() => setIsAddPropertyModalOpen(false)}
          onAddProperty={handleAddPropertySubmit}
        />

        <RoomManagementModal
          property={selectedProperty}
          isOpen={isRoomManagementOpen}
          onClose={handleRoomManagementClose}
          userRole="owner"
        />

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          properties={properties}
        />

        <DocumentReport
          isOpen={isDocumentReportOpen}
          onClose={() => setIsDocumentReportOpen(false)}
          properties={properties}
        />

        <InviteManagerModal
          isOpen={isInviteManagerOpen}
          onClose={() => setIsInviteManagerOpen(false)}
          onManagerInvited={handleManagerInvited}
          properties={properties}
        />

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the property
                and remove all its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteProperty}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        </div>
      </div>
    </div>
  );
};

export default PropertyOwnerDashboard;