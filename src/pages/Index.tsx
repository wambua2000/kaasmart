import { useState, useEffect } from "react";
import Login from "./Login";
import PropertyOwnerDashboard from "@/components/dashboard/PropertyOwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";
import DeveloperDashboard from "@/components/dashboard/DeveloperDashboard";
import AgentDashboard from "@/components/dashboard/AgentDashboard";
import { UserRole } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LanguageSelector from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/lib/i18n";

const Index = () => {
  const [user, setUser] = useState<{ email: string; role: UserRole; tenantInfo?: any } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles' as any)
          .select('email, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            email: (profile as any).email,
            role: (profile as any).role as UserRole
          });
        }
      }
      
      setIsLoadingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoadingSession(false);
        } else if (event === 'SIGNED_IN' && session) {
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles' as any)
              .select('email, role')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                email: (profile as any).email,
                role: (profile as any).role as UserRole
              });
            }
            setIsLoadingSession(false);
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, role: UserRole) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('email, role')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUser({ email: (profile as any).email, role: (profile as any).role as UserRole });
        return;
      }
    }
    
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
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSelector />
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="bg-card/80 backdrop-blur-sm border-border/50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("dashboard.logout")}
        </Button>
      </div>

      {user.role === "developer" && <DeveloperDashboard />}
      {user.role === "owner" && <PropertyOwnerDashboard />}
      {user.role === "manager" && <ManagerDashboard />}
      {user.role === "agent" && <AgentDashboard />}
      {user.role === "tenant" && <TenantDashboard />}
    </div>
  );
};

export default Index;
