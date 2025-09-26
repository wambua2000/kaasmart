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

interface Room {
  id: string;
  room_number: string;
  property_id: string;
  tenant_name?: string | null;
  tenant_email?: string | null;
  tenant_phone?: string | null;
  tenant_date_of_entry?: string | null;
  rent_amount: number;
  rent_status: "paid" | "not-paid";
  is_occupied: boolean;
  tenant_accessories?: string[] | null;
  tenant_notes?: string | null;
  tenant_id?: string | null;
  created_at?: string;
  updated_at?: string;
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
  const [editingTenant, setEditingTenant] = useState<Partial<Room> | null>(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [globalEmergencyContact, setGlobalEmergencyContact] = useState("+254 701 234 567");
  const [editingEmergencyContact, setEditingEmergencyContact] = useState(false);
  const [tempEmergencyContact, setTempEmergencyContact] = useState(globalEmergencyContact);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch rooms from Supabase
  const fetchRooms = async () => {
    if (!property) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('rooms')
        .select('*')
        .eq('property_id', property.id)
        .order('room_number');

      if (error) throw error;
      
      setRooms((data as Room[]) || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && property) {
      fetchRooms();
    }
  }, [isOpen, property]);

  if (!property) return null;

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setShowAddTenant(false);
    setEditingTenant(null);
  };

  const handleEditTenant = (room: Room) => {
    setEditingTenant({ ...room });
  };

  const handleSaveTenant = async () => {
    if (!editingTenant || !selectedRoom) return;
    
    try {
      const updates: any = {
        tenant_name: editingTenant.tenant_name,
        tenant_email: editingTenant.tenant_email,
        tenant_phone: editingTenant.tenant_phone,
      };

      // Only owners can edit additional fields
      if (userRole === "owner") {
        updates.tenant_date_of_entry = editingTenant.tenant_date_of_entry;
        updates.rent_amount = editingTenant.rent_amount;
        updates.tenant_notes = editingTenant.tenant_notes;
      }

      const { error } = await (supabase as any)
        .from('rooms')
        .update(updates)
        .eq('id', selectedRoom.id);

      if (error) throw error;

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { ...room, ...updates }
          : room
      ));

      setSelectedRoom(prev => prev ? { ...prev, ...updates } : prev);
      
      toast({
        title: "Tenant Updated",
        description: "Tenant information has been saved successfully.",
      });
      setEditingTenant(null);
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: "Error",
        description: "Failed to update tenant information.",
        variant: "destructive"
      });
    }
  };

  const handleMarkRentPaid = async (roomId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('rooms')
        .update({ rent_status: 'paid' })
        .eq('id', roomId);

      if (error) throw error;

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, rent_status: 'paid' as const }
          : room
      ));

      if (selectedRoom?.id === roomId) {
        setSelectedRoom(prev => prev ? { ...prev, rent_status: 'paid' as const } : prev);
      }

      toast({
        title: "Rent Marked as Paid",
        description: "The rent status has been updated.",
      });
    } catch (error) {
      console.error('Error updating rent status:', error);
      toast({
        title: "Error",
        description: "Failed to update rent status.",
        variant: "destructive"
      });
    }
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
    if (!selectedRoom) return;
    
    setShowAddTenant(true);
    setEditingTenant({
      tenant_name: "",
      tenant_email: "",
      tenant_phone: "",
      tenant_date_of_entry: new Date().toISOString().split('T')[0],
      rent_amount: selectedRoom.rent_amount,
      rent_status: "not-paid",
      tenant_accessories: [],
    });
  };

  const handleSaveNewTenant = async () => {
    if (!editingTenant || !selectedRoom) return;

    try {
      const updates: any = {
        tenant_name: editingTenant.tenant_name,
        tenant_email: editingTenant.tenant_email,
        tenant_phone: editingTenant.tenant_phone,
        tenant_date_of_entry: editingTenant.tenant_date_of_entry,
        is_occupied: true,
        rent_status: 'not-paid'
      };

      const { error } = await (supabase as any)
        .from('rooms')
        .update(updates)
        .eq('id', selectedRoom.id);

      if (error) throw error;

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { ...room, ...updates }
          : room
      ));

      setSelectedRoom(prev => prev ? { ...prev, ...updates } : prev);
      
      toast({
        title: "Tenant Added",
        description: "New tenant has been added successfully.",
      });
      setShowAddTenant(false);
      setEditingTenant(null);
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast({
        title: "Error",
        description: "Failed to add tenant.",
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
            <h3 className="font-semibold mb-4">Rooms ({rooms.length})</h3>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading rooms...</p>
            ) : (
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
            )}
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
                ) : selectedRoom.is_occupied && selectedRoom.tenant_name ? (
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
                        {editingTenant && editingTenant.id === selectedRoom.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={editingTenant.tenant_name || ""}
                                  onChange={(e) => setEditingTenant({...editingTenant, tenant_name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  value={editingTenant.tenant_email || ""}
                                  onChange={(e) => setEditingTenant({...editingTenant, tenant_email: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                  id="phone"
                                  value={editingTenant.tenant_phone || ""}
                                  onChange={(e) => setEditingTenant({...editingTenant, tenant_phone: e.target.value})}
                                />
                              </div>
                              {userRole === "owner" && (
                                <div>
                                  <Label htmlFor="dateOfEntry">Date of Entry</Label>
                                  <Input
                                    id="dateOfEntry"
                                    type="date"
                                    value={editingTenant.tenant_date_of_entry || ""}
                                    onChange={(e) => setEditingTenant({...editingTenant, tenant_date_of_entry: e.target.value})}
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
                                            const { error } = await (supabase as any)
                                              .from('rooms')
                                              .update({ rent_amount: newAmount })
                                              .eq('id', selectedRoom.id);

                                            if (error) throw error;

                                            setSelectedRoom(prev => prev ? { ...prev, rent_amount: newAmount } : prev);
                                            setRooms(prev => prev.map(room => 
                                              room.id === selectedRoom.id 
                                                ? { ...room, rent_amount: newAmount }
                                                : room
                                            ));

                                            toast({
                                              title: "Rent Updated",
                                              description: `Rent amount updated to KSh ${newAmount.toLocaleString()}`,
                                            });
                                          } catch (error) {
                                            toast({
                                              title: "Error",
                                              description: "Failed to update rent amount.",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                        className="w-32"
                                      />
                                      <span className="text-sm text-muted-foreground">KSh</span>
                                    </div>
                                  ) : (
                                    <p className="font-semibold">KSh {selectedRoom.rent_amount.toLocaleString()}</p>
                                  )}
                                </div>
                                <div>
                                  <Label>Rent Status</Label>
                                  <Badge variant={selectedRoom.rent_status === "paid" ? "default" : "destructive"}>
                                    {selectedRoom.rent_status === "paid" ? "Paid" : "Not Paid"}
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
                                   {(selectedRoom.tenant_accessories || []).map((item, index) => (
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
                            onBlur={async (e) => {
                              if (userRole !== "owner") return;
                              
                              try {
                                const { error } = await (supabase as any)
                                  .from('rooms')
                                  .update({ tenant_notes: e.target.value })
                                  .eq('id', selectedRoom.id);

                                if (error) throw error;

                                setSelectedRoom(prev => prev ? { ...prev, tenant_notes: e.target.value } : prev);
                                
                                toast({
                                  title: "Notes Saved",
                                  description: "Notes have been saved successfully.",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to save notes.",
                                  variant: "destructive"
                                });
                              }
                            }}
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
                              value={editingTenant?.tenant_name || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, tenant_name: e.target.value} : null)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-email">Email</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={editingTenant?.tenant_email || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, tenant_email: e.target.value} : null)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-phone">Phone</Label>
                            <Input
                              id="new-phone"
                              value={editingTenant?.tenant_phone || ""}
                              onChange={(e) => setEditingTenant(prev => prev ? {...prev, tenant_phone: e.target.value} : null)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleSaveNewTenant}>
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