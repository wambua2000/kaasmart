import { useState, useEffect } from "react";
import Login from "./Login";
import PropertyOwnerDashboard from "@/components/dashboard/PropertyOwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";
import DeveloperDashboard from "@/components/dashboard/DeveloperDashboard";
import { UserRole } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [user, setUser] = useState<{ email: string; role: UserRole; tenantInfo?: any } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch user profile to get role
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, role, full_name')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          let tenantInfo = null;
          
          // If tenant, fetch room/property info
          if (profile.role === 'tenant') {
            const { data: roomData } = await supabase
              .from('rooms')
              .select(`
                *,
                properties (
                  id,
                  name,
                  location
                )
              `)
              .eq('tenant_id', session.user.id)
              .single();
            
            tenantInfo = roomData;
          }
          
          setUser({
            email: profile.email,
            role: profile.role as UserRole,
            tenantInfo
          });
        }
      }
      
      setIsLoadingSession(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              email: profile.email,
              role: profile.role as UserRole
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, role: UserRole) => {
    // Check if there's an active Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Fetch profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role, full_name')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        // Handle tenant info if needed
        let tenantInfo = null;
        if (profile.role === 'tenant') {
          const { data: roomData } = await supabase
            .from('rooms')
            .select(`
              *,
              properties (
                id,
                name,
                location
              )
            `)
            .eq('tenant_id', session.user.id)
            .single();
          tenantInfo = roomData;
        }
        
        setUser({ email: profile.email, role: profile.role as UserRole, tenantInfo });
        return;
      }
    }
    
    // Fallback for demo credentials without Supabase session
    setUser({ email, role });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="relative">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="bg-card/80 backdrop-blur-sm border-border/50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Dashboard based on role */}
      {user.role === "developer" && <DeveloperDashboard />}
      {user.role === "owner" && <PropertyOwnerDashboard />}
      {user.role === "manager" && <ManagerDashboard />}
      {user.role === "tenant" && <TenantDashboard tenantInfo={user.tenantInfo} />}
    </div>
  );
};

export default Index;
