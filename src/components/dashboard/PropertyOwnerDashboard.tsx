import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, Users, DollarSign, Plus, MapPin, Mail, FileText, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apartmentInterior from "@/assets/apartment-interior.jpg";

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
  const [properties, setProperties] = useState<Property[]>([
    {
      id: "1",
      name: "Skyline Apartment",
      location: "Nairobi West, Nairobi",
      rentPerRoom: 15000,
      totalRooms: 12,
      occupiedRooms: 10,
      image: apartmentInterior,
    },
    {
      id: "2",
      name: "Yellow House",
      location: "Mombasa Road, Nairobi", 
      rentPerRoom: 18000,
      totalRooms: 8,
      occupiedRooms: 7,
      image: apartmentInterior,
    },
    {
      id: "3",
      name: "White House",
      location: "Kisumu CBD, Kisumu",
      rentPerRoom: 12000,
      totalRooms: 15,
      occupiedRooms: 12,
      image: apartmentInterior,
    },
    {
      id: "4",
      name: "Green House",
      location: "Nakuru Town, Nakuru",
      rentPerRoom: 14000,
      totalRooms: 10,
      occupiedRooms: 8,
      image: apartmentInterior,
    },
  ]);

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, prop) => sum + prop.totalRooms, 0);
  const occupiedRooms = properties.reduce((sum, prop) => sum + prop.occupiedRooms, 0);
  const vacantRooms = totalRooms - occupiedRooms;
  const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1);

  const handleAddProperty = () => {
    toast({
      title: "Add New Property",
      description: "Property addition form would open here.",
    });
  };

  const handleInviteManager = () => {
    toast({
      title: "Invite Manager",
      description: "Manager invitation form would open here.",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Generate Report",
      description: "Property report is being generated...",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-earth p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property Owner Dashboard</h1>
            <p className="text-muted-foreground">Manage your properties with ease</p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-xs text-muted-foreground">{occupancyRate}% occupancy rate</p>
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
                      <span className="text-sm text-muted-foreground">Rent per room</span>
                      <span className="text-lg font-bold text-primary">
                        KSh {property.rentPerRoom.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Occupancy</span>
                      <span className="text-sm font-medium">
                        {((property.occupiedRooms / property.totalRooms) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-hero h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(property.occupiedRooms / property.totalRooms) * 100}%`,
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-hero hover:shadow-glow"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Users className="mr-2 h-4 w-4" />
                        Tenants
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Information */}
        <Card className="mt-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Standard payment details for all properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Paybill:</span>
                <p className="text-muted-foreground">222333</p>
              </div>
              <div>
                <span className="font-medium">M-Pesa Number:</span>
                <p className="text-muted-foreground">0743565674</p>
              </div>
              <div>
                <span className="font-medium">Account Name:</span>
                <p className="text-muted-foreground">John Gikonyo Properties</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyOwnerDashboard;