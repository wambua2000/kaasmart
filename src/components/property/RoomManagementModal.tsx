import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Phone, Mail, Calendar, CreditCard, MapPin, 
  Upload, MessageSquare, UserPlus, Edit, Save, 
  Bed, Table, Home
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfEntry: string;
  rentAmount: number;
  rentStatus: "paid" | "not-paid";
  accessories: string[];
  emergencyContact: string;
  notes?: string;
}

interface Room {
  id: string;
  room_number: string;
  tenant_id?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  tenant_date_of_entry?: string;
  rent_amount: number;
  rent_status: "paid" | "not-paid";
  tenant_accessories?: string[];
  tenant_notes?: string;
  is_occupied: boolean;
  property_id: string;
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

interface RoomManagementModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: "owner" | "manager";
}

const RoomManagementModal = ({ property, isOpen, onClose, userRole }: RoomManagementModalProps) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [globalEmergencyContact, setGlobalEmergencyContact] = useState("+254 701 234 567");
  const [editingEmergencyContact, setEditingEmergencyContact] = useState(false);
  const [tempEmergencyContact, setTempEmergencyContact] = useState(globalEmergencyContact);

  useEffect(() => {
    if (isOpen && property) {
      fetchRooms();
    }
  }, [isOpen, property]);

  const fetchRooms = async () => {
    if (!property) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', property.id)
        .order('room_number');

      if (error) throw error;

      // Transform database data to match Room interface
      const transformedRooms: Room[] = (data || []).map(room => ({
        id: room.id,
        room_number: room.room_number,
        tenant_id: room.tenant_id,
        tenant_name: room.tenant_name,
        tenant_email: room.tenant_email,
        tenant_phone: room.tenant_phone,
        tenant_date_of_entry: room.tenant_date_of_entry,
        rent_amount: room.rent_amount,
        rent_status: room.rent_status as "paid" | "not-paid",
        tenant_accessories: room.tenant_accessories,
        tenant_notes: room.tenant_notes,
        is_occupied: room.is_occupied,
        property_id: room.property_id,
      }));

      setRooms(transformedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setShowAddTenant(false);
    setEditingTenant(null);
  };

  const handleEditTenant = (room: Room) => {
    const tenant: Tenant = {
      id: room.tenant_id || '',
      name: room.tenant_name || '',
      email: room.tenant_email || '',
      phone: room.tenant_phone || '',
      dateOfEntry: room.tenant_date_of_entry || new Date().toISOString().split('T')[0],
      rentAmount: room.rent_amount,
      rentStatus: room.rent_status,
      accessories: room.tenant_accessories || [],
      emergencyContact: globalEmergencyContact,
      notes: room.tenant_notes,
    };
    setEditingTenant(tenant);
  };

  const handleSaveTenant = async () => {
    if (!editingTenant || !selectedRoom || !property) return;
    
    try {
      const updateData = {
        tenant_id: editingTenant.id || null,
        tenant_name: editingTenant.name || null,
        tenant_email: editingTenant.email || null,
        tenant_phone: editingTenant.phone || null,
        tenant_date_of_entry: editingTenant.dateOfEntry || null,
        rent_amount: editingTenant.rentAmount,
        rent_status: editingTenant.rentStatus,
        tenant_accessories: editingTenant.accessories.length > 0 ? editingTenant.accessories : null,
        tenant_notes: editingTenant.notes || null,
        is_occupied: editingTenant.name ? true : false,
      };

      const { error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', selectedRoom.id);

      if (error) throw error;

      toast({
        title: "Tenant Updated",
        description: "Tenant information has been saved successfully.",
      });
      
      // Refresh the rooms data
      await fetchRooms();
      setEditingTenant(null);
      setShowAddTenant(false);
      
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: "Error",
        description: "Failed to save tenant information.",
        variant: "destructive",
      });
    }
  };

  const handleMarkRentPaid = (roomId: string) => {
    toast({
      title: "Rent Marked as Paid",
      description: "The rent status has been updated.",
    });
  };

  const handleSaveNotes = (notes: string) => {
    if (userRole !== "owner") {
      toast({
        title: "Access Denied",
        description: "Only property owners can save notes.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Notes Saved",
      description: "Notes have been saved successfully.",
    });
  };

  const handleSendMessage = (message: string) => {
    toast({
      title: "Message Sent",
      description: "Message has been sent to the tenant.",
    });
  };

  const handleAddTenant = () => {
    if (!selectedRoom || !property) return;
    
    setShowAddTenant(true);
    setEditingTenant({
      id: `tenant-${Date.now()}`, // Generate temporary ID
      name: "",
      email: "",
      phone: "",
      dateOfEntry: new Date().toISOString().split('T')[0],
      rentAmount: property.rentPerRoom,
      rentStatus: "not-paid",
      accessories: [],
      emergencyContact: globalEmergencyContact,
    });
  };


  if (!property) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading rooms...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {property.name} - Room Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[75vh]">
          {/* Rooms List */}
          <div className="w-1/3 border-r pr-6 overflow-y-auto">
            <h3 className="font-semibold mb-4">Rooms ({rooms.length})</h3>
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card 
                  key={room.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <CardContent className="p-3">
                     <div className="flex items-center justify-between">
                       <span className="font-medium">{room.room_number}</span>
                       <Badge variant={room.is_occupied ? "default" : "secondary"}>
                         {room.is_occupied ? "occupied" : "vacant"}
                       </Badge>
                     </div>
                     {room.is_occupied && room.tenant_name && (
                       <div className="mt-2 space-y-1">
                         <p className="text-sm text-muted-foreground">{room.tenant_name}</p>
                         <div className="flex items-center justify-between">
                           <span className="text-xs text-muted-foreground">Rent:</span>
                           <span className="text-xs font-medium">KSh {room.rent_amount.toLocaleString()}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-xs text-muted-foreground">Status:</span>
                           <Badge variant={room.rent_status === "paid" ? "default" : "destructive"} className="text-xs">
                             {room.rent_status === "paid" ? "Paid" : "Due"}
                           </Badge>
                         </div>
                       </div>
                     )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Room Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedRoom ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{selectedRoom.room_number}</h2>
                  <Badge 
                    variant={selectedRoom.is_occupied ? "default" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    {selectedRoom.is_occupied ? "occupied" : "vacant"}
                  </Badge>
                </div>

                {!selectedRoom.is_occupied ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Vacant Room</h3>
                      <p className="text-muted-foreground mb-4">
                        Rent: KSh {selectedRoom.rent_amount.toLocaleString()}/month
                      </p>
                      {userRole === "owner" && (
                        <Button onClick={handleAddTenant}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Tenant
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : selectedRoom.tenant_name ? (
                  <>
                    {/* Tenant Details */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Tenant Details
                          </CardTitle>
                          {(userRole === "owner" || userRole === "manager") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTenant(selectedRoom)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit {userRole === "manager" ? "Info" : ""}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {editingTenant && editingTenant.id === selectedRoom.tenant_id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={editingTenant.name}
                                  onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  value={editingTenant.email}
                                  onChange={(e) => setEditingTenant({...editingTenant, email: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                  id="phone"
                                  value={editingTenant.phone}
                                  onChange={(e) => setEditingTenant({...editingTenant, phone: e.target.value})}
                                />
                              </div>
                              {userRole === "owner" && (
                                <div>
                                  <Label htmlFor="dateOfEntry">Date of Entry</Label>
                                  <Input
                                    id="dateOfEntry"
                                    type="date"
                                    value={editingTenant.dateOfEntry}
                                    onChange={(e) => setEditingTenant({...editingTenant, dateOfEntry: e.target.value})}
                                  />
                                </div>
                              )}
                            </div>
                            {userRole === "manager" && (
                              <p className="text-sm text-muted-foreground">
                                Note: As a manager, you can only edit name, phone, and email.
                              </p>
                            )}
                            <Button onClick={handleSaveTenant}>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </Button>
                          </div>
                         ) : (
                           <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <p className="font-medium">{selectedRoom.tenant_name}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p>{selectedRoom.tenant_email}</p>
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <p>{selectedRoom.tenant_phone}</p>
                                </div>
                                <div>
                                  <Label>Date of Entry</Label>
                                  <p>{selectedRoom.tenant_date_of_entry}</p>
                                </div>
                                <div>
                                  <Label>Rent Amount</Label>
                                  {userRole === "owner" ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={selectedRoom.rent_amount}
                                        onChange={async (e) => {
                                          const newAmount = parseInt(e.target.value) || 0;
                                          try {
                                            const { error } = await supabase
                                              .from('rooms')
                                              .update({ rent_amount: newAmount })
                                              .eq('id', selectedRoom.id);
                                            
                                            if (error) throw error;
                                            
                                            await fetchRooms();
                                            toast({
                                              title: "Rent Updated",
                                              description: `Rent amount updated to KSh ${newAmount.toLocaleString()}`,
                                            });
                                          } catch (error) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to update rent amount.",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        className="w-32"
                                      />
                                      <span className="text-sm text-muted-foreground">KSh</span>
                                    </div>
                                  ) : (
                                    <p className="font-medium">KSh {selectedRoom.rent_amount.toLocaleString()}</p>
                                  )}
                                </div>
                                <div>
                                  <Label>Accessories</Label>
                                  <div className="flex gap-1 mt-1">
                                    {selectedRoom.tenant_accessories?.map((item, index) => (
                                      <Badge key={index} variant="outline">{item}</Badge>
                                    )) || <span className="text-muted-foreground text-sm">No accessories listed</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Payment Details Section */}
                              <div className="bg-muted rounded-lg p-4 space-y-3">
                                <h4 className="font-medium">Payment Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex justify-between">
                                    <span>Monthly Rent:</span>
                                    <span className="font-medium">KSh {selectedRoom.rent_amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Security Deposit:</span>
                                    <span className="font-medium">KSh {(selectedRoom.rent_amount * 2).toLocaleString()}</span>
                                  </div>
                                 <div className="flex justify-between">
                                   <span>Next Due Date:</span>
                                   <span className="font-medium">
                                     {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                   </span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>Late Fee (if applicable):</span>
                                   <span className="font-medium">KSh 1,000</span>
                                 </div>
                               </div>
                               
                                {selectedRoom.rent_status === "not-paid" && (
                                  <div className="mt-3 p-2 bg-destructive/10 rounded border border-destructive/20">
                                    <p className="text-destructive text-sm font-medium">
                                      ⚠️ Rent Due: KSh {selectedRoom.rent_amount.toLocaleString()}
                                    </p>
                                    <p className="text-destructive text-xs mt-1">
                                      Please contact tenant for payment or mark as paid once payment is received.
                                    </p>
                                  </div>
                                )}
                             </div>
                           </div>
                         )}
                      </CardContent>
                    </Card>

                    {/* Action Buttons - Owner Only */}
                    {userRole === "owner" && (
                      <div className="flex gap-3">
                        {selectedRoom.rent_status === "not-paid" && (
                          <Button 
                            onClick={() => handleMarkRentPaid(selectedRoom.id)}
                            className="bg-primary"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Mark Rent as Paid
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline"
                          onClick={() => document.getElementById("lease-upload")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Lease
                        </Button>
                        <input
                          id="lease-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              toast({
                                title: "File Uploaded",
                                description: "Lease agreement uploaded successfully.",
                              });
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Notes Section (Owner only) */}
                    {userRole === "owner" && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            placeholder="Add notes about this tenant..."
                            defaultValue={selectedRoom.tenant_notes || ""}
                            onBlur={(e) => handleSaveNotes(e.target.value)}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Communication - Owner Only */}
                    {userRole === "owner" && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Send Message
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea placeholder="Type your message..." />
                          <Button className="mt-3" onClick={() => handleSendMessage("message")}>
                            Send Message
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : null}

                {/* Add Tenant Form - Owner Only */}
                {showAddTenant && userRole === "owner" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Tenant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-name">Name</Label>
                            <Input
                              id="new-name"
                              value={editingTenant?.name || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, name: e.target.value} : null)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-email">Email</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={editingTenant?.email || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, email: e.target.value} : null)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-phone">Phone</Label>
                            <Input
                              id="new-phone"
                              value={editingTenant?.phone || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, phone: e.target.value} : null)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-emergency">Emergency Contact</Label>
                            <Input
                              id="new-emergency"
                              value={editingTenant?.emergencyContact || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, emergencyContact: e.target.value} : null)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => {
                              toast({
                                title: "Tenant Added",
                                description: "New tenant has been added successfully. Login credentials generated.",
                              });
                              setShowAddTenant(false);
                            }}
                          >
                            Add Tenant
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setShowAddTenant(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a room to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomManagementModal;