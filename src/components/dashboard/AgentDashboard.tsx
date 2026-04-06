import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle, Receipt, Home, MessageSquare, Wrench, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MessageCenter from "@/components/messaging/MessageCenter";
import MaintenanceRequestForm from "@/components/messaging/MaintenanceRequestForm";

interface PropertyStats {
  id: string;
  name: string;
  location: string;
  rent_per_room: number;
  total_rooms: number;
  image_url: string | null;
  occupied_rooms: number;
  total_collected: number;
  pending_amount: number;
}

interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  tenant_name?: string;
  room_number?: string;
}

const AgentDashboard = () => {
  const [properties, setProperties] = useState<PropertyStats[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
  
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentData();
  }, []);

  const handleOpenSheet = () => {
    window.open("https://docs.google.com/spreadsheets/d/1zi_wSIlvUlOoaJH9kcn1DjbzJnnHi8a1tOUps2z3BK4/edit?gid=0#gid=0", "_blank");
  };

  const fetchAgentData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Try RPC first, fallback to direct queries
      let propertiesResult: PropertyStats[] = [];
      const { data: rpcData, error: rpcError } = await (supabase
        .rpc as any)('get_agent_properties_with_stats', { agent_user_id: user.id });

      if (rpcError) {
        console.warn('RPC failed, using direct queries:', rpcError);
        // Fallback: fetch from agent_properties + properties + rooms
        const { data: assignments } = await supabase
          .from('agent_properties')
          .select('property_id, can_manage_all')
          .eq('agent_id', user.id);

        if (assignments && assignments.length > 0) {
          const managesAll = assignments.some((a: any) => a.can_manage_all);
          let query = supabase.from('properties').select('*');
          if (!managesAll) {
            const propertyIds = assignments.map((a: any) => a.property_id).filter(Boolean);
            query = query.in('id', propertyIds);
          }
          const { data: props } = await query;
          
          for (const prop of (props || [])) {
            const { count: occupiedCount } = await supabase
              .from('rooms')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', prop.id)
              .eq('is_occupied', true);
            
            const { data: payments } = await supabase
              .from('payments')
              .select('amount')
              .eq('property_id', prop.id)
              .eq('status', 'completed');
            
            const totalCollected = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            
            const { data: unpaidRooms } = await supabase
              .from('rooms')
              .select('rent_amount')
              .eq('property_id', prop.id)
              .eq('is_occupied', true)
              .eq('rent_status', 'not-paid');
            
            const pendingAmount = (unpaidRooms || []).reduce((sum: number, r: any) => sum + (r.rent_amount || 0), 0);

            propertiesResult.push({
              id: prop.id,
              name: prop.name,
              location: prop.location || '',
              rent_per_room: prop.rent_per_room || 0,
              total_rooms: prop.total_rooms || 0,
              image_url: prop.image_url,
              occupied_rooms: occupiedCount || 0,
              total_collected: totalCollected,
              pending_amount: pendingAmount,
            });
          }
        }
      } else {
        propertiesResult = rpcData || [];
      }
      
      setProperties(propertiesResult);

      // Fetch recent payments
      const { data: paymentsData, error: paymentsError } = await (supabase
        .from('payments' as any)
        .select(`
          *,
          rooms!inner(room_number, tenant_id)
        `)
        .order('payment_date', { ascending: false })
        .limit(10) as any);

      if (paymentsError) throw paymentsError;
      
      // Fetch tenant names separately
      const paymentsWithNames = await Promise.all(
        (paymentsData || []).map(async (payment: any) => {
          const { data: profile } = await (supabase
            .from('profiles' as any)
            .select('full_name')
            .eq('id', payment.tenant_id)
            .maybeSingle() as any);
          
          return {
            id: payment.id,
            tenant_id: payment.tenant_id,
            amount: payment.amount,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method || 'N/A',
            status: payment.status,
            tenant_name: profile?.full_name || 'Unknown',
            room_number: payment.rooms?.room_number || 'N/A'
          };
        })
      );
      
      setRecentPayments(paymentsWithNames);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomsForProperty = async (propertyId: string) => {
    if (!propertyId) return;
    
    const { data, error } = await (supabase
      .from('rooms' as any)
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_occupied', true) as any);
    
    if (!error && data) {
      // Fetch tenant names separately
      const roomsWithNames = await Promise.all(
        data.map(async (room: any) => {
          if (room.tenant_id) {
            const { data: profile } = await (supabase
              .from('profiles' as any)
              .select('full_name')
              .eq('id', room.tenant_id)
              .maybeSingle() as any);
            
            return {
              ...room,
              profiles: { full_name: profile?.full_name || 'Unknown' }
            };
          }
          return room;
        })
      );
      setRooms(roomsWithNames);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const room = rooms.find(r => r.id === selectedRoom);
      if (!room) throw new Error("Room not found");

      const paymentData = {
        tenant_id: room.tenant_id,
        property_id: selectedProperty,
        room_id: selectedRoom,
        amount: Number(formData.get('amount')),
        payment_method: formData.get('payment_method') as string,
        payment_date: formData.get('payment_date') as string,
        notes: formData.get('notes') as string | null,
        recorded_by: currentUserId,
        status: 'confirmed' as const
      };

      const { error } = await (supabase.from('payments' as any).insert(paymentData as any) as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setIsPaymentOpen(false);
      fetchAgentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const room = rooms.find(r => r.id === selectedRoom);
      if (!room) throw new Error("Room not found");

      const reminderData = {
        tenant_id: room.tenant_id,
        property_id: selectedProperty,
        room_id: selectedRoom,
        amount_due: room.rent_amount,
        due_date: formData.get('due_date') as string,
        message: formData.get('message') as string | null,
        sent_by: currentUserId,
        reminder_date: new Date().toISOString()
      };

      const { error } = await (supabase.from('payment_reminders' as any).insert(reminderData as any) as any);

      if (error) throw error;

      // Send SMS notification
      await supabase.functions.invoke('send-sms-notification', {
        body: {
          receiver_id: room.tenant_id,
          sender_id: currentUserId,
          content: formData.get('message') as string,
        }
      });

      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
      setIsReminderOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedProperty) {
      fetchRoomsForProperty(selectedProperty);
    }
  }, [selectedProperty]);

  const totalProperties = properties.length;
  const totalCollected = properties.reduce((sum, prop) => sum + Number(prop.total_collected), 0);
  const totalPending = properties.reduce((sum, prop) => sum + Number(prop.pending_amount), 0);
  const collectionRate = totalCollected + totalPending > 0 
    ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar 
          userRole="agent"
          onOpenSheet={handleOpenSheet}
          onInviteManager={() => {}}
          onInviteAgent={() => {}}
        />
        
        <div className="flex-1 p-8 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Financial Agent Dashboard</h1>
            <p className="text-muted-foreground">Manage rent collection and financial reports</p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsPaymentOpen(true)}>
              <Receipt className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <Button variant="outline" onClick={() => setIsReminderOpen(true)}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
            <Button variant="outline" onClick={() => setIsMessageCenterOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-emerald-200 dark:border-emerald-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Properties Assigned</CardTitle>
                <Home className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{totalProperties}</div>
                <p className="text-xs text-muted-foreground">Active properties</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collected (Month)</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">${totalCollected.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total rent collected</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">${totalPending.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Outstanding rent</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{collectionRate}%</div>
                <p className="text-xs text-muted-foreground">Payment success rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Properties Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-emerald-600" />
                Assigned Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <Card key={property.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{property.location}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Occupied:</span>
                          <span className="font-medium">{property.occupied_rooms}/{property.total_rooms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Collected:</span>
                          <span className="font-medium text-emerald-600">${Number(property.total_collected).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pending:</span>
                          <span className="font-medium text-orange-600">${Number(property.pending_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{payment.tenant_name}</p>
                          <p className="text-sm text-muted-foreground">Room: {payment.room_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">${Number(payment.amount).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Center Dialog */}
      <Dialog open={isMessageCenterOpen} onOpenChange={setIsMessageCenterOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Message Center
            </DialogTitle>
            <DialogDescription>
              Communicate with property owners and tenants
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            {currentUserId && (
              <MessageCenter
                currentUserId={currentUserId}
                currentUserRole="agent"
                properties={properties.map(p => ({ id: p.id, name: p.name }))}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>


      {/* Send Reminder Dialog */}
      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Send Payment Reminder
            </DialogTitle>
            <DialogDescription>
              Send a payment reminder to a tenant
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendReminder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-property">Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty} required>
                <SelectTrigger id="reminder-property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && (
              <div className="space-y-2">
                <Label htmlFor="reminder-tenant">Tenant</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom} required>
                  <SelectTrigger id="reminder-tenant">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.profiles?.full_name || 'Unknown'} - Room {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reminder-date">Due Date</Label>
              <Input type="date" id="reminder-date" name="due_date" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-message">Message</Label>
              <Textarea
                id="reminder-message"
                name="message"
                placeholder="Enter reminder message..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Send Reminder
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record a rent payment from a tenant
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-property">Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty} required>
                <SelectTrigger id="payment-property">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && (
              <div className="space-y-2">
                <Label htmlFor="payment-tenant">Tenant</Label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom} required>
                  <SelectTrigger id="payment-tenant">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.profiles?.full_name || 'Unknown'} - Room {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                type="number"
                id="payment-amount"
                name="amount"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select name="payment_method" required>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input type="date" id="payment-date" name="payment_date" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notes (Optional)</Label>
              <Textarea
                id="payment-notes"
                name="notes"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Record Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AgentDashboard;
