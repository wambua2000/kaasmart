import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import kaasmartLogo from "@/assets/kaasmart-logo.png";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "owner" | "manager" | "tenant";

interface LoginFormProps {
  onLogin: (email: string, role: UserRole) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
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

    // Demo credentials for owner
    const validCredentials = {
      owner: { email: "owner@kaasmart.com", password: "admin123" },
    };

    // Check credentials based on role
    if (role === 'manager' || role === 'tenant') {
      try {
        // Check against database invitations
        const { data, error } = await supabase.rpc('verify_invitation_login', {
          login_email: email,
          login_password: password
        });

        if (error) {
          console.error('Login error:', error);
          toast({
            title: "Login Error",
            description: "Please check your credentials and try again.",
            variant: "destructive",
          });
          return;
        }

        if (data && data.length > 0) {
          const invitationData = data[0];
          
          // Verify the role matches
          if (invitationData.user_role === role) {
            toast({
              title: "Welcome to KaaSmart!",
              description: `Logged in as ${role === 'manager' ? 'Manager' : 'Tenant'}`,
            });
            onLogin(email, role);
          } else {
            toast({
              title: "Invalid Role",
              description: `This account is registered as ${invitationData.user_role}, not ${role}.`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Invalid Credentials",
            description: `${role === 'manager' ? 'Manager' : 'Tenant'} credentials not found. Please contact the property owner for access.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Login error:', error);
        toast({
          title: "Login Error",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Check owner credentials
      const creds = validCredentials[role];
      if (email === creds.email && password === creds.password) {
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Property Owner`,
        });
        onLogin(email, role);
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Please check your email, password, and role selection.",
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                Sign In
              </Button>

              <div className="text-center">
                <Button variant="link" className="text-primary hover:text-primary-glow">
                  Forgot Password?
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
    </div>
  );
};

export default LoginForm;