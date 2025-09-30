import { useState } from "react";
import Login from "./Login";
import PropertyOwnerDashboard from "@/components/dashboard/PropertyOwnerDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";
import DeveloperDashboard from "@/components/dashboard/DeveloperDashboard";
import { UserRole } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<{ email: string; role: UserRole; tenantInfo?: any } | null>(null);

  const handleLogin = (email: string, role: UserRole) => {
    let tenantInfo = null;
    
    // If logging in as tenant, get their room/property info
    if (role === 'tenant') {
      const storedTenantCredentials = JSON.parse(localStorage.getItem('tenantCredentials') || '[]');
      tenantInfo = storedTenantCredentials.find((cred: any) => cred.email === email);
    }
    
    setUser({ email, role, tenantInfo });
  };

  const handleLogout = () => {
    setUser(null);
  };

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
