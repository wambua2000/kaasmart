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
  Bed, Table, Home, DollarSign
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
  number: string;
  status: "occupied" | "vacant";
  tenant?: Tenant;
  rentAmount: number;
  room_number: string;
  property_id: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  tenant_date_of_entry?: string;
  rent_status?: string;
  tenant_accessories?: string[];
  tenant_notes?: string;
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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [globalEmergencyContact, setGlobalEmergencyContact] = useState("+254 701 234 567");
  const [editingEmergencyContact, setEditingEmergencyContact] = useState(false);
  const [tempEmergencyContact, setTempEmergencyContact] = useState(globalEmergencyContact);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRent, setEditingRent] = useState<{roomId: string, amount: number} | null>(null);
  const [messages, setMessages] = useState<Array<{id: string, message: string, created_at: string}>>([]);

  // Fetch rooms from Supabase
  const fetchRooms = async () => {
    if (!property) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', property.id);

      if (error) throw error;

      const formattedRooms: Room[] = data.map(room => ({
        id: room.id,
        number: room.room_number,
        status: room.is_occupied ? "occupied" : "vacant",
        rentAmount: room.rent_amount,
        room_number: room.room_number,
        property_id: room.property_id,
        tenant_name: room.tenant_name,
        tenant_email: room.tenant_email,
        tenant_phone: room.tenant_phone,
        tenant_date_of_entry: room.tenant_date_of_entry,
        rent_status: room.rent_status || 'not-paid',
        tenant_accessories: room.tenant_accessories || [],
        tenant_notes: room.tenant_notes,
        tenant: room.tenant_name ? {
          id: room.tenant_id || room.id,
          name: room.tenant_name,
          email: room.tenant_email || '',
          phone: room.tenant_phone || '',
          dateOfEntry: room.tenant_date_of_entry || '',
          rentAmount: room.rent_amount,
          rentStatus: (room.rent_status as "paid" | "not-paid") || 'not-paid',
          accessories: room.tenant_accessories || [],
          emergencyContact: globalEmergencyContact,
          notes: room.tenant_notes
        } : undefined
      }));

      setRooms(formattedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for the selected room
  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (property && isOpen) {
      fetchRooms();
    }
  }, [property, isOpen]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  if (!property) return null;

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setShowAddTenant(false);
    setEditingTenant(null);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant({ ...tenant });
  };

  const handleSaveTenant = async () => {
    if (!editingTenant || !selectedRoom) return;
    
    try {
      const updates = {
        tenant_name: editingTenant.name,
        tenant_email: editingTenant.email,
        tenant_phone: editingTenant.phone,
        tenant_date_of_entry: editingTenant.dateOfEntry,
        rent_status: editingTenant.rentStatus,
        tenant_accessories: editingTenant.accessories,
        tenant_notes: editingTenant.notes,
        is_occupied: true
      };

      // For managers, only allow editing name, phone, and email
      if (userRole === "manager") {
        const restrictedUpdates = {
          tenant_name: editingTenant.name,
          tenant_email: editingTenant.email,
          tenant_phone: editingTenant.phone,
        };
        
        const { error } = await supabase
          .from('rooms')
          .update(restrictedUpdates)
          .eq('id', selectedRoom.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rooms')
          .update(updates)
          .eq('id', selectedRoom.id);

        if (error) throw error;
      }

      toast({
        title: "Tenant Updated",
        description: "Tenant information has been saved successfully.",
      });
      setEditingTenant(null);
      fetchRooms(); // Refresh the rooms data
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: "Error",
        description: "Failed to update tenant information.",
        variant: "destructive"
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

  const handleSendMessage = async (message: string) => {
    if (!selectedRoom || !property) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          property_id: property.id,
          room_id: selectedRoom.id,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          tenant_id: selectedRoom.tenant?.id,
          message: message
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Message has been sent to the tenant.",
      });
      fetchMessages(selectedRoom.id); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  const handleAddTenant = () => {
    setShowAddTenant(true);
    setEditingTenant({
      id: "",
      name: "",
      email: "",
      phone: "",
      dateOfEntry: new Date().toISOString().split('T')[0],
      rentAmount: selectedRoom?.rentAmount || property.rentPerRoom,
      rentStatus: "not-paid",
      accessories: [],
      emergencyContact: globalEmergencyContact,
    });
  };

  const handleSaveNewTenant = async () => {
    if (!editingTenant || !selectedRoom) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          tenant_name: editingTenant.name,
          tenant_email: editingTenant.email,
          tenant_phone: editingTenant.phone,
          tenant_date_of_entry: editingTenant.dateOfEntry,
          rent_status: editingTenant.rentStatus,
          tenant_accessories: editingTenant.accessories,
          tenant_notes: editingTenant.notes,
          is_occupied: true
        })
        .eq('id', selectedRoom.id);

      if (error) throw error;

      toast({
        title: "Tenant Added",
        description: "Tenant has been added successfully.",
      });
      setShowAddTenant(false);
      setEditingTenant(null);
      fetchRooms(); // Refresh the rooms data
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast({
        title: "Error",
        description: "Failed to add tenant.",
        variant: "destructive"
      });
    }
  };

  const handleEditRent = (roomId: string, currentAmount: number) => {
    if (userRole !== "owner") {
      toast({
        title: "Access Denied",
        description: "Only property owners can edit rent amounts.",
        variant: "destructive"
      });
      return;
    }
    setEditingRent({ roomId, amount: currentAmount });
  };

  const handleSaveRent = async () => {
    if (!editingRent) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ rent_amount: editingRent.amount })
        .eq('id', editingRent.roomId);

      if (error) throw error;

      toast({
        title: "Rent Updated",
        description: "Rent amount has been updated successfully.",
      });
      setEditingRent(null);
      fetchRooms(); // Refresh the rooms data
    } catch (error) {
      console.error('Error updating rent:', error);
      toast({
        title: "Error",
        description: "Failed to update rent amount.",
        variant: "destructive"
      });
    }
  };

  const handleSaveEmergencyContact = () => {
    if (userRole !== "owner") {
      toast({
        title: "Access Denied",
        description: "Only property owners can edit emergency contact.",
        variant: "destructive"
      });
      return;
    }
    setGlobalEmergencyContact(tempEmergencyContact);
    setEditingEmergencyContact(false);
    toast({
      title: "Emergency Contact Updated",
      description: "Global emergency contact has been updated for all rooms.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {property.name} - Room Management
          </DialogTitle>
        </DialogHeader>

        {/* Global Emergency Contact Section - Only for Property Owner */}
        {userRole === "owner" && (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Global Emergency Contact</h3>
                <p className="text-sm text-muted-foreground">This emergency contact applies to all rooms</p>
              </div>
              {editingEmergencyContact ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempEmergencyContact}
                    onChange={(e) => setTempEmergencyContact(e.target.value)}
                    placeholder="Emergency contact number"
                    className="w-48"
                  />
                  <Button size="sm" onClick={handleSaveEmergencyContact}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingEmergencyContact(false);
                    setTempEmergencyContact(globalEmergencyContact);
                  }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{globalEmergencyContact}</span>
                  <Button size="sm" variant="outline" onClick={() => setEditingEmergencyContact(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-6 h-[75vh]">
          {/* Rooms List */}
          <div className="w-1/3 border-r pr-6 overflow-y-auto">
            <h3 className="font-semibold mb-4">Rooms ({property.totalRooms})</h3>
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
                       <span className="font-medium">{room.number}</span>
                       <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
                         {room.status}
                       </Badge>
                     </div>
                     {room.tenant && (
                       <div className="mt-2 space-y-1">
                         <p className="text-sm text-muted-foreground">{room.tenant.name}</p>
                         <div className="flex items-center justify-between">
                           <span className="text-xs text-muted-foreground">Rent:</span>
                           <span className="text-xs font-medium">KSh {room.tenant.rentAmount.toLocaleString()}</span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-xs text-muted-foreground">Status:</span>
                           <Badge variant={room.tenant.rentStatus === "paid" ? "default" : "destructive"} className="text-xs">
                             {room.tenant.rentStatus === "paid" ? "Paid" : "Due"}
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
                  <h2 className="text-2xl font-bold">{selectedRoom.number}</h2>
                  <Badge 
                    variant={selectedRoom.status === "occupied" ? "default" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    {selectedRoom.status}
                  </Badge>
                </div>

                {selectedRoom.status === "vacant" ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Vacant Room</h3>
                      <p className="text-muted-foreground mb-4">
                        Rent: KSh {selectedRoom.rentAmount.toLocaleString()}/month
                      </p>
                      {userRole === "owner" && (
                        <Button onClick={handleAddTenant}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Tenant
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : selectedRoom.tenant ? (
                  <>
                    {/* Tenant Details */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Tenant Details
                          </CardTitle>
                          {userRole === "owner" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTenant(selectedRoom.tenant!)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {editingTenant && editingTenant.id === selectedRoom.tenant.id ? (
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
                            </div>
                            <Button onClick={showAddTenant ? handleSaveNewTenant : handleSaveTenant}>
                              <Save className="mr-2 h-4 w-4" />
                              {showAddTenant ? "Add Tenant" : "Save Changes"}
                            </Button>
                          </div>
                         ) : (
                           <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <Label>Name</Label>
                                 <p className="font-medium">{selectedRoom.tenant.name}</p>
                               </div>
                               <div>
                                 <Label>Email</Label>
                                 <p>{selectedRoom.tenant.email}</p>
                               </div>
                               <div>
                                 <Label>Phone</Label>
                                 <p>{selectedRoom.tenant.phone}</p>
                               </div>
                               <div>
                                 <Label>Date of Entry</Label>
                                 <p>{selectedRoom.tenant.dateOfEntry}</p>
                               </div>
                                <div>
                                  <Label>Rent Amount</Label>
                                  {editingRent?.roomId === selectedRoom.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={editingRent.amount}
                                        onChange={(e) => setEditingRent({...editingRent, amount: Number(e.target.value)})}
                                        className="w-32"
                                      />
                                      <Button size="sm" onClick={handleSaveRent}>
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingRent(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold">KSh {selectedRoom.tenant.rentAmount.toLocaleString()}</p>
                                      {userRole === "owner" && (
                                        <Button size="sm" variant="outline" onClick={() => handleEditRent(selectedRoom.id, selectedRoom.tenant.rentAmount)}>
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                               <div>
                                 <Label>Rent Status</Label>
                                 <Badge variant={selectedRoom.tenant.rentStatus === "paid" ? "default" : "destructive"}>
                                   {selectedRoom.tenant.rentStatus === "paid" ? "Paid" : "Not Paid"}
                                 </Badge>
                               </div>
                                {userRole === "owner" && (
                                  <div>
                                    <Label>Emergency Contact (Global)</Label>
                                    <p>{globalEmergencyContact}</p>
                                  </div>
                                )}
                               <div>
                                 <Label>Accessories</Label>
                                 <div className="flex gap-1 mt-1">
                                   {selectedRoom.tenant.accessories.map((item, index) => (
                                     <Badge key={index} variant="outline">{item}</Badge>
                                   ))}
                                 </div>
                               </div>
                             </div>

                             {/* Payment Details Section */}
                             <div className="bg-muted rounded-lg p-4 space-y-3">
                               <h4 className="font-medium">Payment Details</h4>
                               <div className="grid grid-cols-2 gap-4 text-sm">
                                 <div className="flex justify-between">
                                   <span>Monthly Rent:</span>
                                   <span className="font-medium">KSh {selectedRoom.tenant.rentAmount.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>Security Deposit:</span>
                                   <span className="font-medium">KSh {(selectedRoom.tenant.rentAmount * 2).toLocaleString()}</span>
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
                               
                               {selectedRoom.tenant.rentStatus === "not-paid" && (
                                 <div className="mt-3 p-2 bg-destructive/10 rounded border border-destructive/20">
                                   <p className="text-destructive text-sm font-medium">
                                     ⚠️ Rent Due: KSh {selectedRoom.tenant.rentAmount.toLocaleString()}
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
                        {selectedRoom.tenant.rentStatus === "not-paid" && (
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
                            defaultValue={selectedRoom.tenant.notes}
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