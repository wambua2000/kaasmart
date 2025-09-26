import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Wrench, MessageSquare, Phone, Mail, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apartmentInterior from "@/assets/apartment-interior.jpg";

interface MaintenanceRequest {
  id: string;
  tenantName: string;
  room: string;
  issue: string;
  priority: "low" | "medium" | "high";
  date: string;
  status: "pending" | "in-progress" | "completed";
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  room: string;
  apartment: string;
  rentAmount: number;
  dateOfEntry: string;
}

const ManagerDashboard = () => {
  const { toast } = useToast();
  const [maintenanceRequests] = useState<MaintenanceRequest[]>([
    {
      id: "1",
      tenantName: "Sarah Wanjiku",
      room: "White001",
      issue: "Leaking faucet in bathroom",
      priority: "high",
      date: "2024-01-15",
      status: "pending",
    },
    {
      id: "2",
      tenantName: "John Mwangi",
      room: "Green005",
      issue: "Broken window lock",
      priority: "medium",
      date: "2024-01-14",
      status: "in-progress",
    },
    {
      id: "3",
      tenantName: "Grace Achieng",
      room: "Skyline008",
      issue: "Light bulb replacement needed",
      priority: "low",
      date: "2024-01-13",
      status: "completed",
    },
  ]);

  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: "1",
      name: "Sarah Wanjiku",
      email: "sarah.w@email.com",
      phone: "0712345678",
      room: "White001",
      apartment: "White House",
      rentAmount: 12000,
      dateOfEntry: "2023-10-15",
    },
    {
      id: "2",
      name: "John Mwangi",
      email: "john.m@email.com",
      phone: "0723456789",
      room: "Green005",
      apartment: "Green House",
      rentAmount: 14000,
      dateOfEntry: "2023-11-01",
    },
  ]);

  const [message, setMessage] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "secondary";
      case "in-progress": return "default";
      case "pending": return "destructive";
      default: return "default";
    }
  };

  const handleUpdateTenant = (tenantId: string, field: string, value: string) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === tenantId ? { ...tenant, [field]: value } : tenant
    ));
    toast({
      title: "Tenant Updated",
      description: "Tenant information has been updated successfully.",
    });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the property owner.",
    });
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-earth p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
            <p className="text-muted-foreground">Manage properties and assist tenants</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Manager Access
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">Under your management</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
              <Wrench className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {maintenanceRequests.filter(req => req.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Pending requests</p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">3</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="maintenance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="maintenance">Maintenance Requests</TabsTrigger>
            <TabsTrigger value="tenants">Tenant Management</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Maintenance Requests
                </CardTitle>
                <CardDescription>
                  View and manage tenant maintenance requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{request.tenantName}</h4>
                          <Badge variant="outline">
                            {request.room}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.issue}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {request.date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Tenant Management
                </CardTitle>
                <CardDescription>
                  Edit tenant contact information (limited access)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{tenant.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {tenant.apartment} - {tenant.room}
                          </p>
                        </div>
                        <Badge variant="outline">
                          KSh {tenant.rentAmount.toLocaleString()}/month
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </label>
                          <input
                            type="email"
                            value={tenant.email}
                            onChange={(e) => handleUpdateTenant(tenant.id, "email", e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={tenant.phone}
                            onChange={(e) => handleUpdateTenant(tenant.id, "phone", e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex items-center gap-4">
                        <span>Entry Date: {tenant.dateOfEntry}</span>
                      </div>
                    </div>
                  ))}
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
                  Communicate with property owner and tenants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Send Message to Property Owner</label>
                  <Textarea
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
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Property Owner</span>
                        <span className="text-xs text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm">Please check on the maintenance request in White House room 001.</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Sarah Wanjiku</span>
                        <span className="text-xs text-muted-foreground">1 day ago</span>
                      </div>
                      <p className="text-sm">The faucet in my bathroom is still leaking. When can someone come to fix it?</p>
                    </div>
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

export default ManagerDashboard;