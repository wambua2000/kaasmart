import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Phone, Mail, Calendar, CreditCard, MapPin, 
  Upload, MessageSquare, UserPlus, Edit, Save, 
  Bed, Table, Home, Send
} from "lucide-react";
import InviteTenantModal from "./InviteTenantModal";

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
  property_id?: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
  rent_per_room: number;
  total_rooms: number;
  occupiedRooms: number;
  image_url?: string;
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
  const [isInviteTenantOpen, setIsInviteTenantOpen] = useState(false);
  const [globalEmergencyContact, setGlobalEmergencyContact] = useState("+254 701 234 567");
  const [editingEmergencyContact, setEditingEmergencyContact] = useState(false);
  const [tempEmergencyContact, setTempEmergencyContact] = useState(globalEmergencyContact);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingRentAmount, setEditingRentAmount] = useState(false);
  const [tempRentAmount, setTempRentAmount] = useState<number>(0);
  const [messageContent, setMessageContent] = useState<string>("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch rooms from database when property changes
  React.useEffect(() => {
    const fetchRooms = async () => {
      if (!property) return;

      try {
        const { data: roomsData, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('property_id', property.id)
          .order('room_number');

        if (error) throw error;

        const mappedRooms = (roomsData || []).map((room: any) => ({
          id: room.id,
          number: room.room_number,
          status: room.is_occupied ? "occupied" : "vacant",
          rentAmount: Number(room.rent_amount),
          property_id: room.property_id,
          tenant: room.tenant_id ? {
            id: room.tenant_id,
            name: room.tenant_name || "Unknown",
            email: room.tenant_email || "",
            phone: room.tenant_phone || "",
            dateOfEntry: room.tenant_date_of_entry || new Date().toISOString().split('T')[0],
            rentAmount: Number(room.rent_amount),
            rentStatus: (room.rent_status as "paid" | "not-paid") || "not-paid",
            accessories: typeof room.tenant_accessories === 'string' ? JSON.parse(room.tenant_accessories || '[]') : (room.tenant_accessories || []),
            emergencyContact: globalEmergencyContact,
            notes: room.tenant_notes || undefined,
          } : undefined
        }));

        setRooms(mappedRooms as Room[]);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchRooms();
  }, [property?.id, globalEmergencyContact]);

  if (!property) return null;


  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setEditingTenant(null);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant({ ...tenant });
  };

  const handleSaveTenant = () => {
    if (!editingTenant || !selectedRoom) return;
    
    // Update the specific room with the edited tenant data
    setRooms(prevRooms => 
      prevRooms.map(room => 
        room.id === selectedRoom.id 
          ? { ...room, tenant: editingTenant }
          : room
      )
    );
    
    // Update the selected room to reflect changes
    setSelectedRoom(prev => prev ? { ...prev, tenant: editingTenant } : null);
    
    toast({
      title: "Tenant Updated",
      description: "Tenant information has been saved successfully.",
    });
    setEditingTenant(null);
  };

  const handleMarkRentPaid = (roomId: string) => {
    // Update the specific room's rent status
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId && room.tenant
          ? { ...room, tenant: { ...room.tenant, rentStatus: "paid" } }
          : room
      )
    );
    
    // Update selected room if it's the one being updated
    if (selectedRoom?.id === roomId && selectedRoom.tenant) {
      setSelectedRoom(prev => prev ? {
        ...prev,
        tenant: { ...prev.tenant!, rentStatus: "paid" }
      } : null);
    }
    
    toast({
      title: "Rent Marked as Paid",
      description: "The rent status has been updated.",
    });
  };

  const handleSaveNotes = async (notes: string, roomId: string) => {
    if (userRole !== "owner") {
      toast({
        title: "Access Denied",
        description: "Only property owners can save notes.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ tenant_notes: notes })
        .eq('id', roomId);
      
      if (error) throw error;
      
      // Update local state for this specific room
      setRooms(prevRooms =>
        prevRooms.map(room =>
          room.id === roomId && room.tenant
            ? { ...room, tenant: { ...room.tenant, notes } }
            : room
        )
      );
      
      toast({
        title: "Notes Saved",
        description: "Notes have been saved for this tenant only.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedRoom?.tenant) {
      toast({
        title: "Cannot Send Message",
        description: "Please enter a message and ensure a tenant is selected.",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Send message to this specific room's tenant only
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedRoom.tenant.id,
          property_id: selectedRoom.property_id || property.id,
          content: messageContent,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessageContent("");
      toast({
        title: "Message Sent",
        description: `Message sent to ${selectedRoom.tenant.name} in ${selectedRoom.number.charAt(0).toUpperCase() + selectedRoom.number.slice(1)}. SMS notification will be sent if available.`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddTenant = () => {
    if (selectedRoom) {
      setIsInviteTenantOpen(true);
    }
  };

  const handleTenantInvited = async (tenantData: {
    email: string;
    password: string;
    propertyName: string;
    roomNumber: string;
    name: string;
    dateOfEntry: string;
  }) => {
    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "No room selected",
        variant: "destructive"
      });
      return;
    }

    try {
      // Clean up any previous room assignments for this email before creating new invitation
      const { data: existingRooms } = await supabase
        .from('rooms')
        .select('id, property_id')
        .eq('tenant_email', tenantData.email)
        .eq('is_occupied', true);

      if (existingRooms && existingRooms.length > 0) {
        // Clear tenant from old rooms
        await supabase
          .from('rooms')
          .update({
            tenant_id: null,
            is_occupied: false,
            tenant_name: null,
            tenant_email: null,
            tenant_phone: null,
            tenant_accessories: null,
            tenant_date_of_entry: null,
          })
          .in('id', existingRooms.map(r => r.id));
      }

      // Create invitation in database using the Supabase function
      const { data, error: invitationError } = await (supabase.rpc as any)('generate_invitation_credentials', {
        invitation_email: tenantData.email,
        invitation_role: 'tenant',
        invite_property_id: property.id,
        invite_room_id: selectedRoom.id,
      });

      if (invitationError) {
        console.error('Error creating tenant invitation:', invitationError);
        toast({
          title: "Error",
          description: "Failed to create tenant invitation. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update the room with tenant information (but not tenant_id yet - that's set on login)
      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          tenant_name: tenantData.name,
          tenant_email: tenantData.email,
          tenant_date_of_entry: tenantData.dateOfEntry,
          is_occupied: true,
        })
        .eq('id', selectedRoom.id);

      if (updateError) {
        console.error('Error updating room:', updateError);
        toast({
          title: "Warning",
          description: "Invitation created but room details may not have updated.",
          variant: "destructive",
        });
      }

      // Call edge function to create the actual auth user
      const { error: authError } = await supabase.functions.invoke('create-invited-user', {
        body: {
          email: tenantData.email,
          password: tenantData.password,
          role: 'tenant',
          property_id: property.id,
          room_id: selectedRoom.id
        }
      });

      if (authError) {
        console.error('Error creating user account:', authError);
        toast({
          title: "Warning",
          description: "Invitation created but user account creation may have failed. Please check logs.",
          variant: "destructive",
        });
      } else {
        console.log('User account created successfully');
      }

      // Refresh rooms list to show updated data
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', property.id)
        .order('room_number');

      if (roomsData) {
        const mappedRooms = (roomsData as any[]).map((room: any) => ({
          id: room.id,
          number: room.room_number,
          status: room.is_occupied ? "occupied" : "vacant",
          rentAmount: Number(room.rent_amount),
          property_id: room.property_id,
          tenant: room.is_occupied ? {
            id: room.tenant_id || '',
            name: room.tenant_name || "Unknown",
            email: room.tenant_email || "",
            phone: room.tenant_phone || "",
            dateOfEntry: room.tenant_date_of_entry || new Date().toISOString().split('T')[0],
            rentAmount: Number(room.rent_amount),
            rentStatus: (room.rent_status as "paid" | "not-paid") || "not-paid",
            accessories: typeof room.tenant_accessories === 'string' ? JSON.parse(room.tenant_accessories || '[]') : (room.tenant_accessories || []),
            emergencyContact: globalEmergencyContact,
            notes: room.tenant_notes || undefined,
          } : undefined
        }));
        setRooms(mappedRooms as Room[]);
        
        // Update selected room to show new tenant
        const updatedSelectedRoom = mappedRooms.find((r: any) => r.id === selectedRoom.id);
        if (updatedSelectedRoom) {
          setSelectedRoom(updatedSelectedRoom as Room);
        }
      }

      toast({
        title: "Tenant Invited Successfully",
        description: `Login credentials generated for ${tenantData.name}. Share the credentials with the tenant.`,
      });

      setIsInviteTenantOpen(false);
    } catch (error) {
      console.error('Error inviting tenant:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
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

  const handleSaveRentAmount = async () => {
    if (!selectedRoom || userRole !== "owner") {
      toast({
        title: "Access Denied",
        description: "Only property owners can edit rent amounts.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ rent_amount: tempRentAmount })
        .eq('id', selectedRoom.id);

      if (error) throw error;

      // Update local state
      setRooms(prevRooms =>
        prevRooms.map(room =>
          room.id === selectedRoom.id
            ? { ...room, rentAmount: tempRentAmount }
            : room
        )
      );
      setSelectedRoom(prev => prev ? { ...prev, rentAmount: tempRentAmount } : null);
      setEditingRentAmount(false);

      toast({
        title: "Rent Updated",
        description: "Rent amount has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating rent amount:', error);
      toast({
        title: "Error",
        description: "Failed to update rent amount. Please try again.",
        variant: "destructive"
      });
    }
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
            <h3 className="font-semibold mb-4">Rooms ({property.total_rooms})</h3>
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
                       <span className="font-medium">{room.number.charAt(0).toUpperCase() + room.number.slice(1)}</span>
                       <Badge variant={room.status === "occupied" ? "default" : "secondary"}>
                         {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
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
                  <h2 className="text-2xl font-bold">{selectedRoom.number.charAt(0).toUpperCase() + selectedRoom.number.slice(1)}</h2>
                  <Badge 
                    variant={selectedRoom.status === "occupied" ? "default" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    {selectedRoom.status.charAt(0).toUpperCase() + selectedRoom.status.slice(1)}
                  </Badge>
                </div>

                {selectedRoom.status === "vacant" ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Vacant Room</h3>
                      {userRole === "owner" ? (
                        editingRentAmount ? (
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <Input
                              type="number"
                              value={tempRentAmount}
                              onChange={(e) => setTempRentAmount(parseInt(e.target.value) || 0)}
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">KSh/month</span>
                            <Button size="sm" onClick={handleSaveRentAmount}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingRentAmount(false);
                                setTempRentAmount(selectedRoom.rentAmount);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <p className="text-muted-foreground">
                              Rent: KSh {selectedRoom.rentAmount.toLocaleString()}/month
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingRentAmount(true);
                                setTempRentAmount(selectedRoom.rentAmount);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      ) : (
                        <p className="text-muted-foreground mb-4">
                          Rent: KSh {selectedRoom.rentAmount.toLocaleString()}/month
                        </p>
                      )}
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
                          {(userRole === "owner" || userRole === "manager") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTenant(selectedRoom.tenant!)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit {userRole === "manager" ? "Info" : ""}
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
                                  {userRole === "owner" ? (
                                    editingRentAmount ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={tempRentAmount}
                                          onChange={(e) => setTempRentAmount(parseInt(e.target.value) || 0)}
                                          className="w-32"
                                        />
                                        <span className="text-sm text-muted-foreground">KSh</span>
                                        <Button size="sm" onClick={handleSaveRentAmount}>
                                          <Save className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => {
                                            setEditingRentAmount(false);
                                            setTempRentAmount(selectedRoom.rentAmount);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold">KSh {selectedRoom.rentAmount.toLocaleString()}</p>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => {
                                            setEditingRentAmount(true);
                                            setTempRentAmount(selectedRoom.rentAmount);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )
                                  ) : (
                                    <p className="font-semibold">KSh {selectedRoom.tenant.rentAmount.toLocaleString()}</p>
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
                            onBlur={(e) => handleSaveNotes(e.target.value, selectedRoom.id)}
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
                            Send Message to {selectedRoom.tenant.name}
                          </CardTitle>
                          <CardDescription>
                            This message will only be sent to the tenant in {selectedRoom.number.charAt(0).toUpperCase() + selectedRoom.number.slice(1)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Textarea 
                            placeholder="Type your message..." 
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            rows={4}
                          />
                          <Button 
                            className="w-full bg-gradient-hero hover:shadow-glow" 
                            onClick={handleSendMessage}
                            disabled={!messageContent.trim() || sendingMessage}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            {sendingMessage ? 'Sending...' : `Send to ${selectedRoom.tenant.name}`}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : null}

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a room to view details</p>
              </div>
            )}
          </div>
        </div>

        <InviteTenantModal
          isOpen={isInviteTenantOpen}
          onClose={() => setIsInviteTenantOpen(false)}
          onTenantInvited={handleTenantInvited}
          propertyName={property.name}
          roomNumber={selectedRoom?.number || ''}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RoomManagementModal;