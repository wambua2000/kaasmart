import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, Calendar, CreditCard, MapPin, Users } from "lucide-react";

interface Room {
  id: string;
  number: string;
  tenant?: {
    name: string;
    phone: string;
    email: string;
    moveInDate: string;
    rent: number;
    paymentStatus: "paid" | "pending" | "overdue";
    lastPayment: string;
  };
  rent: number;
  status: "occupied" | "vacant" | "maintenance";
}

interface Property {
  id: string;
  name: string;
  location: string;
  rentPerRoom: number;
  totalRooms: number;
  occupiedRooms: number;
  image: string;
}

interface RoomDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const RoomDetailsModal = ({ property, isOpen, onClose }: RoomDetailsModalProps) => {
  if (!property) return null;

  // Generate mock room data
  const generateRooms = (totalRooms: number, occupiedRooms: number): Room[] => {
    const rooms: Room[] = [];
    const tenantNames = [
      "John Kamau", "Mary Wanjiku", "Peter Ochieng", "Grace Akinyi", "David Mwangi",
      "Sarah Njeri", "James Kiprotich", "Lucy Wambui", "Samuel Otieno", "Rose Wairimu",
      "Michael Kiplagat", "Faith Nyambura", "Joseph Muturi", "Alice Wanjiru", "Daniel Kimani"
    ];

    for (let i = 1; i <= totalRooms; i++) {
      const isOccupied = i <= occupiedRooms;
      const room: Room = {
        id: `${property.id}-${i}`,
        number: `R${i.toString().padStart(3, '0')}`,
        rent: property.rentPerRoom,
        status: isOccupied ? "occupied" : "vacant",
      };

      if (isOccupied) {
        const randomTenant = tenantNames[Math.floor(Math.random() * tenantNames.length)];
        const randomPaymentStatus = Math.random() > 0.8 ? "overdue" : Math.random() > 0.3 ? "paid" : "pending";
        room.tenant = {
          name: randomTenant,
          phone: `+254 7${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `${randomTenant.toLowerCase().replace(' ', '.')}@email.com`,
          moveInDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rent: property.rentPerRoom,
          paymentStatus: randomPaymentStatus,
          lastPayment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
      }

      rooms.push(room);
    }
    return rooms;
  };

  const rooms = generateRooms(property.totalRooms, property.occupiedRooms);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied": return "bg-primary";
      case "vacant": return "bg-muted";
      case "maintenance": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-primary";
      case "pending": return "bg-orange-500";
      case "overdue": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {property.name} - Room Details
          </DialogTitle>
          <DialogDescription>
            {property.location} • {property.totalRooms} Total Rooms • {property.occupiedRooms} Occupied
          </DialogDescription>
        </DialogHeader>

        {/* Payment Information Section */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Paybill Number:</span>
                <p className="font-semibold">222333</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">M-Pesa Number:</span>
                <p className="font-semibold">0743565674</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Account Name:</span>
                <p className="font-semibold">{property.name}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Rent Per Room:</span>
                <p className="font-semibold text-primary">KSh {property.rentPerRoom.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Rooms Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Rooms</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Occupied ({property.occupiedRooms})
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted"></div>
                Vacant ({property.totalRooms - property.occupiedRooms})
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-card/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{room.number}</CardTitle>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {room.tenant ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{room.tenant.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{room.tenant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{room.tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Moved in: {room.tenant.moveInDate}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Rent:</span>
                          <span className="font-semibold">KSh {room.tenant.rent.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Payment Status:</span>
                          <Badge className={getPaymentStatusColor(room.tenant.paymentStatus)}>
                            {room.tenant.paymentStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Payment:</span>
                          <span>{room.tenant.lastPayment}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Room Available</p>
                      <p className="text-xs">KSh {room.rent.toLocaleString()}/month</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailsModal;