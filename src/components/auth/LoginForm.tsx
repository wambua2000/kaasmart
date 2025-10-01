import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail, Eye, EyeOff, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import kaasmartLogo from "@/assets/kaasmart-logo.png";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "owner" | "manager" | "tenant" | "developer";

interface LoginFormProps {
  onLogin: (email: string, role: UserRole) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    // Get stored manager and tenant credentials
    const storedManagerCredentials = JSON.parse(localStorage.getItem('managerCredentials') || '[]');
    const storedTenantCredentials = JSON.parse(localStorage.getItem('tenantCredentials') || '[]');
    
    // Demo credentials
    const validCredentials = {
      owner: { email: "owner@kaasmart.com", password: "admin123" },
      developer: { email: "dev@kaasmart.com", password: "dev123" },
    };

    // Check credentials based on role
    if (role === 'manager') {
      // Check against stored manager credentials
      const managerMatch = storedManagerCredentials.find((cred: any) => 
        cred.email === email && cred.password === password
      );
      
      if (managerMatch) {
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Manager`,
        });
        onLogin(email, role);
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Manager credentials not found. Please contact the property owner for access.",
          variant: "destructive",
        });
      }
    } else if (role === 'tenant') {
      // Check against stored tenant credentials
      const tenantMatch = storedTenantCredentials.find((cred: any) => 
        cred.email === email && cred.password === password
      );
      
      if (tenantMatch) {
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Tenant - ${tenantMatch.propertyName}, Room ${tenantMatch.roomNumber}`,
        });
        onLogin(email, role);
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Tenant credentials not found. Please contact the property owner for access.",
          variant: "destructive",
        });
      }
    } else if (role === 'owner') {
      // Check demo owner first
      if (email === validCredentials.owner.email && password === validCredentials.owner.password) {
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Property Owner`,
        });
        onLogin(email, role);
        return;
      }

      // Check invitations table for generated owner credentials
      try {
        const { data, error } = await supabase.rpc('verify_invitation_login', {
          login_email: email,
          login_password: password
        });

        if (error) throw error;

        if (data && data.length > 0 && data[0].user_role === 'owner') {
          toast({
            title: "Welcome to KaaSmart!",
            description: `Logged in as Property Owner`,
          });
          onLogin(email, role);
        } else {
          toast({
            title: "Invalid Credentials",
            description: "Please check your email and password.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Invalid Credentials",
          description: "Please check your email and password.",
          variant: "destructive",
        });
      }
    } else if (role === 'developer') {
      // Check developer credentials
      const creds = validCredentials.developer;
      if (email === creds.email && password === creds.password) {
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Developer/Admin`,
        });
        onLogin(email, role);
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Please check your email and password.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      {/* Login Form */}
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border-border/20 shadow-2xl">
          <CardHeader className="text-center">
            {/* Logo */}
            <div className="mb-4">
              <img 
                src={kaasmartLogo} 
                alt="KaaSmart Logo" 
                className="h-16 w-auto mx-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              KaaSmart Manager
            </CardTitle>
            <CardDescription>
              Property management made simple and beautiful
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Login as</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Developer/Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="owner">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Property Owner
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Manager/Caretaker
                      </div>
                    </SelectItem>
                    <SelectItem value="tenant">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Tenant
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                Sign In
              </Button>

              <div className="text-center">
                <Button 
                  type="button"
                  variant="link" 
                  className="text-primary hover:text-primary-glow"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgot Password?
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>

        <ForgotPasswordDialog 
          open={isForgotPasswordOpen} 
          onOpenChange={setIsForgotPasswordOpen}
        />
    </div>
  );
};

export default LoginForm;