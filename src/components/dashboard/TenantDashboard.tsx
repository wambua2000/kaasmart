import { useState, useEffect } from "react";
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
import useProfileSync from "@/hooks/useProfileSync";
import LeaseUpload from "@/components/property/LeaseUpload";
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

interface TenantDashboardProps {
  tenantInfo?: {
    email: string;
    propertyName: string;
    roomNumber: string;
    tenantName: string;
    dateOfEntry: string;
  };
}

const TenantDashboard = ({ tenantInfo: loggedInTenantInfo }: TenantDashboardProps) => {
  const { toast } = useToast();
  useProfileSync(); // Enable real-time profile synchronization
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>(() => {
    // Use logged-in tenant info if available, otherwise use demo data
    if (loggedInTenantInfo) {
      // Map property locations
      const locationMap: Record<string, string> = {
        'White House': 'Kisumu CBD, Kisumu',
        'Yellow House': 'Nyalenda, Kisumu',
        'Green House': 'Kondele, Kisumu',
        'Skyline Apartment': 'Tom Mboya Street, Kisumu'
      };
      
      return {
        name: loggedInTenantInfo.tenantName,
        email: loggedInTenantInfo.email,
        phone: "",
        room: loggedInTenantInfo.roomNumber,
        apartment: loggedInTenantInfo.propertyName,
        location: locationMap[loggedInTenantInfo.propertyName] || "Kisumu, Kenya",
        rentAmount: 12000, // Default rent amount
        dateOfEntry: loggedInTenantInfo.dateOfEntry,
        emergencyContact: "",
        accessories: ["Bed", "Table", "Chair", "Wardrobe", "Study Desk"],
        roomId: `${loggedInTenantInfo.propertyName}-${loggedInTenantInfo.roomNumber}`,
        propertyId: loggedInTenantInfo.propertyName.toLowerCase().replace(/\s+/g, '-'),
      };
    }
    
    // Demo data for non-logged in users
    return {
      name: "Sarah Wanjiku",
      email: "sarah.w@email.com", 
      phone: "0712345678",
      room: "White001",
      apartment: "White House",
      location: "Kisumu CBD, Kisumu",
      rentAmount: 12000,
      dateOfEntry: "2023-10-15",
      emergencyContact: "0723456789",
      accessories: ["Bed", "Table", "Chair", "Wardrobe", "Study Desk"],
      roomId: "mock-room-id",
      propertyId: "mock-property-id",
    };
  });

  const [maintenanceRequest, setMaintenanceRequest] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{id: string, message: string, sender_name: string, created_at: string}>>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<Array<{id: string, message: string, created_at: string, status: string}>>([]);

  // Fetch messages and maintenance history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch messages for this tenant
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('tenant_id', user.id)
          .order('created_at', { ascending: false });

        if (messagesData) {
          const formattedMessages = messagesData.map(msg => ({
            id: msg.id,
            message: msg.message,
            sender_name: msg.sender_id === user.id ? 'You' : 'Property Manager',
            created_at: new Date(msg.created_at).toLocaleDateString()
          }));
          setMessages(formattedMessages);

          // Separate maintenance requests from regular messages
          const maintenanceRequests = messagesData
            .filter(msg => msg.message.toLowerCase().includes('maintenance') || msg.message.toLowerCase().includes('repair'))
            .map(msg => ({
              id: msg.id,
              message: msg.message,
              created_at: new Date(msg.created_at).toLocaleDateString(),
              status: 'pending' // Could be enhanced with actual status from database
            }));
          setMaintenanceHistory(maintenanceRequests);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleUpdateInfo = async (field: keyof TenantInfo, value: string) => {
    if (field === "name" || field === "email" || field === "phone") {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update profile in database
        const updateData: any = {};
        if (field === "name") updateData.full_name = value;
        if (field === "email") updateData.email = value;
        if (field === "phone") updateData.phone = value;

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        // Update tenant info in rooms table if needed
        if (field === "name" || field === "email" || field === "phone") {
          const roomUpdateData: any = {};
          if (field === "name") roomUpdateData.tenant_name = value;
          if (field === "email") roomUpdateData.tenant_email = value;
          if (field === "phone") roomUpdateData.tenant_phone = value;

          await supabase
            .from('rooms')
            .update(roomUpdateData)
            .eq('tenant_id', user.id);
        }

        setTenantInfo(prev => ({ ...prev, [field]: value }));
        toast({
          title: "Information Updated",
          description: "Your information has been updated successfully and synced across the system.",
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update information. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleMaintenanceRequest = async () => {
    if (!maintenanceRequest.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's room and property info
      const { data: roomData } = await supabase
        .from('rooms')
        .select('property_id, room_number')
        .eq('tenant_id', user.id)
        .single();

      if (!roomData) return;

      // Insert maintenance request message
      const { error } = await supabase
        .from('messages')
        .insert({
          tenant_id: user.id,
          sender_id: user.id,
          property_id: roomData.property_id,
          room_id: null,
          message: `MAINTENANCE REQUEST: ${maintenanceRequest}`
        });

      if (error) throw error;

      toast({
        title: "Maintenance Request Sent",
        description: "Your maintenance request has been submitted to the manager and property owner.",
      });
      setMaintenanceRequest("");

      // Refresh messages
      window.location.reload();
    } catch (error) {
      console.error('Error sending maintenance request:', error);
      toast({
        title: "Error",
        description: "Failed to send maintenance request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant's room and property info
      const { data: roomData } = await supabase
        .from('rooms')
        .select('property_id, room_number')
        .eq('tenant_id', user.id)
        .single();

      if (!roomData) return;

      // Insert message
      const { error } = await supabase
        .from('messages')
        .insert({
          tenant_id: user.id,
          sender_id: user.id,
          property_id: roomData.property_id,
          room_id: null,
          message: message
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the property manager and owner.",
      });
      setMessage("");

      // Refresh messages
      window.location.reload();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

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
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Maintenance Request
                </CardTitle>
                <CardDescription>
                  Report maintenance issues in your room
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance">Describe the issue</Label>
                  <Textarea
                    id="maintenance"
                    value={maintenanceRequest}
                    onChange={(e) => setMaintenanceRequest(e.target.value)}
                    placeholder="Please describe the maintenance issue in detail..."
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleMaintenanceRequest}
                  className="bg-gradient-hero hover:shadow-glow"
                >
                  Submit Request
                </Button>
              </CardContent>
            </Card>

            {/* Previous Requests */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle>My Maintenance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceHistory.length > 0 ? (
                    maintenanceHistory.map((request) => (
                      <div key={request.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{request.message.replace('MAINTENANCE REQUEST: ', '')}</span>
                          <Badge variant={request.status === 'completed' ? 'secondary' : 'destructive'}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Submitted on {request.created_at}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center">No maintenance requests yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Messages
                </CardTitle>
                <CardDescription>
                  Communicate with property manager and owner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message">Send Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="mt-2"
                    rows={4}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="mt-2 bg-gradient-hero hover:shadow-glow"
                  >
                    Send Message
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Recent Messages</h4>
                  <div className="space-y-3">
                    {messages.length > 0 ? (
                      messages.slice(0, 5).map((msg) => (
                        <div key={msg.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{msg.sender_name}</span>
                            <span className="text-xs text-muted-foreground">{msg.created_at}</span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center">No messages yet</p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;