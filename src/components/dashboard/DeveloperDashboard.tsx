import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, UserPlus, Mail, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppFooter } from "@/components/layout/AppFooter";
import InvitePropertyOwnerModal from "@/components/property/InvitePropertyOwnerModal";
import PasswordResetRequestsSheet from "@/components/property/PasswordResetRequestsSheet";

interface PropertyOwner {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  propertyCount: number;
}

const DeveloperDashboard = () => {
  const { toast } = useToast();
  const [propertyOwners, setPropertyOwners] = useState<PropertyOwner[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPasswordResetSheetOpen, setIsPasswordResetSheetOpen] = useState(false);
  const [pendingResetCount, setPendingResetCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all property owners
  useEffect(() => {
    fetchPropertyOwners();
    fetchPendingResetCount();

    // Set up real-time subscription for password reset requests
    const channel = supabase
      .channel('password_reset_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'password_reset_requests'
        },
        () => {
          fetchPendingResetCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPropertyOwners = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all profiles with role 'owner'
      const { data: profiles, error: profilesError } = await (supabase
        .from('profiles' as any)
        .select('*')
        .eq('role', 'owner')
        .order('created_at', { ascending: false }) as any);

      if (profilesError) throw profilesError;

      // For each owner, count their properties
      const ownersWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await (supabase
            .from('properties' as any)
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.id) as any);

          return {
            ...profile,
            propertyCount: count || 0,
          };
        })
      );

      setPropertyOwners(ownersWithCounts as any);
    } catch (error) {
      console.error('Error fetching property owners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch property owners",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteOwner = () => {
    setIsInviteModalOpen(true);
  };

  const handleOwnerInvited = async () => {
    toast({
      title: "Property Owner Invited",
      description: "The new property owner can now log in with their credentials",
    });
    // Refresh the list
    await fetchPropertyOwners();
  };

  const fetchPendingResetCount = async () => {
    try {
      const { count, error } = await supabase
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('user_role', 'owner');

      if (error) throw error;
      setPendingResetCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending reset count:', error);
    }
  };

  const totalOwners = propertyOwners.length;
  const totalProperties = propertyOwners.reduce((sum, owner) => sum + owner.propertyCount, 0);
  const ownersWithProperties = propertyOwners.filter(o => o.propertyCount > 0).length;

  return (
    <div className="min-h-screen">
      {/* Blue Header Bar */}
      <div className="w-full h-16 bg-blue-600 flex items-center px-6">
        <Shield className="mr-3 h-6 w-6 text-white" />
        <h1 className="text-white text-2xl font-bold">KaaSmart - Developer Backend</h1>
      </div>

      <div className="bg-gradient-earth p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Developer Dashboard</h1>
              <p className="text-muted-foreground">Manage property owners and system settings</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsPasswordResetSheetOpen(true)} 
                variant="outline"
                className="relative"
              >
                <Key className="mr-2 h-4 w-4" />
                Password Reset Requests
                {pendingResetCount > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground">
                    {pendingResetCount}
                  </Badge>
                )}
              </Button>
              <Button onClick={handleInviteOwner} className="bg-gradient-hero hover:shadow-glow">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Property Owner
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Property Owners</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalOwners}</div>
                <p className="text-xs text-muted-foreground">Registered owners</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{totalProperties}</div>
                <p className="text-xs text-muted-foreground">Across all owners</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Owners</CardTitle>
                <UserPlus className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{ownersWithProperties}</div>
                <p className="text-xs text-muted-foreground">Owners with properties</p>
              </CardContent>
            </Card>
          </div>

          {/* Property Owners List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Property Owners</h2>
              <Badge variant="secondary" className="text-sm">
                {totalOwners} Owners
              </Badge>
            </div>

            {isLoading ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">Loading property owners...</p>
                </CardContent>
              </Card>
            ) : propertyOwners.length === 0 ? (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">No Property Owners Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Invite your first property owner to get started
                      </p>
                      <Button onClick={handleInviteOwner} className="bg-gradient-hero">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Property Owner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertyOwners.map((owner) => (
                  <Card key={owner.id} className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card hover:shadow-warm transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{owner.full_name || 'Unnamed Owner'}</CardTitle>
                        <Badge variant={owner.propertyCount > 0 ? "default" : "secondary"}>
                          {owner.propertyCount} {owner.propertyCount === 1 ? 'Property' : 'Properties'}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {owner.email}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Joined</span>
                          <span className="font-medium">
                            {new Date(owner.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={owner.propertyCount > 0 ? "default" : "outline"} className="text-xs">
                            {owner.propertyCount > 0 ? 'Active' : 'Pending Setup'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AppFooter />

      <InvitePropertyOwnerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onOwnerInvited={handleOwnerInvited}
      />

      <PasswordResetRequestsSheet
        open={isPasswordResetSheetOpen}
        onOpenChange={setIsPasswordResetSheetOpen}
        onRequestsUpdated={fetchPendingResetCount}
      />
    </div>
  );
};

export default DeveloperDashboard;