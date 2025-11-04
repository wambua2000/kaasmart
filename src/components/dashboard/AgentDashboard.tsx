import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle, Receipt, Home, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MessageCenter from "@/components/messaging/MessageCenter";

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
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Fetch properties with stats using the new function
      const { data: propertiesData, error: propertiesError } = await supabase
        .rpc('get_agent_properties_with_stats', { agent_user_id: user.id });

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch recent payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          rooms!inner(room_number, tenant_id),
          profiles!payments_tenant_id_fkey(full_name)
        `)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;
      
      const formattedPayments = (paymentsData || []).map((payment: any) => ({
        id: payment.id,
        tenant_id: payment.tenant_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'N/A',
        status: payment.status,
        tenant_name: payment.profiles?.full_name || 'Unknown',
        room_number: payment.rooms?.room_number || 'N/A'
      }));

      setRecentPayments(formattedPayments);
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
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Receipt className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <Button variant="outline">
              <AlertCircle className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Report
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
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AgentDashboard;
