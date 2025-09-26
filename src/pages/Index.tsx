import { useState, useEffect } from "react";
import Login from "./Login";
import PropertyOwnerDashboard from "@/components/dashboard/PropertyOwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";
import { UserRole } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<{ email: string; role: UserRole } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            email: session.user.email || '',
            role: profile.role as UserRole
          });
        }
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            email: session.user.email || '',
            role: profile.role as UserRole
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (email: string, role: UserRole) => {
    setUser({ email, role });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
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
      {user.role === "owner" && <PropertyOwnerDashboard />}
      {user.role === "manager" && <ManagerDashboard />}
      {user.role === "tenant" && <TenantDashboard />}
    </div>
  );
};

export default Index;
