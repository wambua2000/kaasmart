import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, User, Phone, Mail, MessageSquare, Wrench, FileText, MapPin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppFooter } from "@/components/layout/AppFooter";
import LeaseUpload from "@/components/property/LeaseUpload";
import MessageCenter from "@/components/messaging/MessageCenter";
import MaintenanceRequestForm from "@/components/messaging/MaintenanceRequestForm";
import beautifulTenantRoom from "@/assets/beautiful-tenant-room.jpg";

interface TenantInfo {
  name: string;
  email: string;
  phone: string;
  room: string;
  apartment: string;
  location: string;
  rentAmount: number;
  dateOfEntry: string;
  emergencyContact: string;
  accessories: string[];
  roomId?: string;
  propertyId?: string;
}

const TenantDashboard = () => {
  const { toast } = useToast();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    name: "",
    email: "",
    phone: "",
    room: "",
    apartment: "",
    location: "",
    rentAmount: 0,
    dateOfEntry: "",
    emergencyContact: "",
    accessories: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tenant's room and property info on mount
  useEffect(() => {
    const fetchTenantData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: roomData, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          rent_amount,
          tenant_date_of_entry,
          tenant_name,
          tenant_email,
          tenant_phone,
          tenant_accessories,
          properties (
            id,
            name,
            location
          )
        `)
        .eq('tenant_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching tenant room data:', error);
        toast({
          title: "Error Loading Room Data",
          description: "Could not load your room information. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!roomData) {
        console.warn('No room data found for tenant');
        toast({
          title: "No Room Assigned",
          description: "You don't have a room assigned yet. Please contact your property owner.",
        });
        setIsLoading(false);
        return;
      }

      if (roomData && roomData.properties) {
        setTenantInfo({
          name: roomData.tenant_name || session.user.email || "Tenant",
          email: roomData.tenant_email || session.user.email || "",
          phone: roomData.tenant_phone || "+254 712 345 678",
          room: roomData.room_number,
          apartment: roomData.properties.name,
          location: roomData.properties.location,
          rentAmount: Number(roomData.rent_amount),
          dateOfEntry: roomData.tenant_date_of_entry || new Date().toISOString().split('T')[0],
          emergencyContact: "+254 701 234 567",
          accessories: roomData.tenant_accessories || ["Bed", "Table", "Chair"],
          roomId: roomData.id,
          propertyId: roomData.properties.id,
        });
      }
      setIsLoading(false);
    };

    fetchTenantData();
  }, []);

  // Set up real-time listener for tenant profile updates
  useEffect(() => {
    const channel = supabase
      .channel('tenant-profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `tenant_email=eq.${tenantInfo.email}`
        },
        (payload) => {
          console.log('Tenant profile updated:', payload);
          // Update local state with new tenant data
          const updatedRoom = payload.new;
          setTenantInfo(prev => ({
            ...prev,
            name: updatedRoom.tenant_name || prev.name,
            email: updatedRoom.tenant_email || prev.email,
            phone: updatedRoom.tenant_phone || prev.phone,
            accessories: updatedRoom.tenant_accessories || prev.accessories,
            dateOfEntry: updatedRoom.tenant_date_of_entry || prev.dateOfEntry
          }));
          
          toast({
            title: "Profile Updated",
            description: "Your tenant profile has been updated successfully.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantInfo.email, toast]);

  const [maintenanceRequest, setMaintenanceRequest] = useState("");
  const [message, setMessage] = useState("");


  const handleUpdateInfo = (field: keyof TenantInfo, value: string) => {
    if (field === "name" || field === "email" || field === "phone") {
      setTenantInfo(prev => ({ ...prev, [field]: value }));
      toast({
        title: "Information Updated",
        description: "Your information has been updated successfully.",
      });
    }
  };

  const handleMaintenanceRequest = () => {
    if (!maintenanceRequest.trim()) return;
    
    toast({
      title: "Maintenance Request Sent",
      description: "Your maintenance request has been submitted to the manager.",
    });
    setMaintenanceRequest("");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the property manager.",
    });
    setMessage("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-earth">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your room details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-earth p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Room</h1>
            <p className="text-muted-foreground">Welcome back, {tenantInfo.name}</p>
          </div>
          <Badge variant="outline" className="text-sm">
            Tenant Access
          </Badge>
        </div>

        {/* Room Overview */}
        <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-card overflow-hidden">
          <div className="relative">
            <img
              src={beautifulTenantRoom}
              alt="Your beautiful room with accessories"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-2xl font-bold">{tenantInfo.apartment}</h2>
              <p className="text-white/90 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {tenantInfo.location}
              </p>
            </div>
            <div className="absolute top-6 right-6">
              <Badge className="bg-primary/90 text-primary-foreground">
                Room {tenantInfo.room}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Room Details</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Room Information */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Room Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Apartment:</span>
                    <span className="font-medium">{tenantInfo.apartment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Number:</span>
                    <span className="font-medium">{tenantInfo.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{tenantInfo.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Date:</span>
                    <span className="font-medium">{tenantInfo.dateOfEntry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span className="font-bold text-primary">
                      KSh {tenantInfo.rentAmount.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Room Accessories */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
                <CardHeader>
                  <CardTitle>Room Accessories</CardTitle>
                  <CardDescription>Items included in your room</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tenantInfo.accessories.map((item, index) => (
                      <Badge key={index} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Lease Upload Section */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Lease Documents
                    </h4>
                    <LeaseUpload roomId={tenantInfo.roomId} propertyId={tenantInfo.propertyId} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Information */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Use these details to pay your rent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Paybill:</span>
                    <p className="text-muted-foreground">222333</p>
                  </div>
                  <div>
                    <span className="font-medium">Account Number:</span>
                    <p className="text-muted-foreground">{tenantInfo.room}</p>
                  </div>
                  <div>
                    <span className="font-medium">M-Pesa Number:</span>
                    <p className="text-muted-foreground">0743565674</p>
                  </div>
                  <div>
                    <span className="font-medium">Account Name:</span>
                    <p className="text-muted-foreground">John Gikonyo Properties</p>
                  </div>
                  <div>
                    <span className="font-medium">M-Pesa Name:</span>
                    <p className="text-muted-foreground">John Gikonyo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  My Profile
                </CardTitle>
                <CardDescription>
                  Edit your personal information (name, email, phone only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={tenantInfo.name}
                      onChange={(e) => handleUpdateInfo("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={tenantInfo.phone}
                      onChange={(e) => handleUpdateInfo("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tenantInfo.email}
                    onChange={(e) => handleUpdateInfo("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input
                    value={tenantInfo.emergencyContact}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact property owner to update emergency contact
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceRequestForm
              tenantId="mock-tenant-id"
              propertyId={tenantInfo.propertyId}
              roomId={tenantInfo.roomId}
            />

            {/* Previous Requests */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>My Maintenance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Leaking faucet in bathroom</span>
                      <Badge variant="destructive">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Submitted on Jan 15, 2024</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Light bulb replacement</span>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Submitted on Jan 10, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessageCenter
              currentUserId="mock-tenant-id"
              currentUserRole="tenant"
              roomId={tenantInfo.roomId}
              propertyId={tenantInfo.propertyId}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <AppFooter />
    </div>
  );
};

export default TenantDashboard;