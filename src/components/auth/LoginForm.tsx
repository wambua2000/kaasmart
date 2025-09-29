import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import kaasmartLogo from "@/assets/kaasmart-logo.png";

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

    try {
      // Owner demo credentials (only owner remains as demo)
      if (role === 'owner' && email === "owner@kaasmart.com" && password === "admin123") {
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Property Owner`,
        });
        onLogin(email, role);
        return;
      }

      // For tenants and managers, try Supabase authentication
      if (role === 'tenant') {
        // First check if there's an invitation for this email
        const { data: invitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', email)
          .eq('role', 'tenant')
          .eq('is_used', false)
          .single();

        if (!invitation) {
          toast({
            title: "Invalid Credentials", 
            description: "No invitation found for this email. Please contact the property owner.",
            variant: "destructive",
          });
          return;
        }

        // Check if password matches temporary password
        if (invitation.temporary_password !== password) {
          toast({
            title: "Invalid Credentials",
            description: "Invalid password. Please check your credentials.",
            variant: "destructive",
          });
          return;
        }

        // Sign up the user with Supabase
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              role: 'tenant',
              full_name: email.split('@')[0]
            }
          }
        });

        if (signUpError) {
          // If user already exists, try to sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            toast({
              title: "Authentication Error",
              description: "Failed to authenticate. Please try again.",
              variant: "destructive",
            });
            return;
          }
        }

        // Update room information when tenant logs in
        if (invitation.room_id) {
          const { error: updateError } = await supabase
            .from('rooms')
            .update({
              tenant_id: authData?.user?.id,
              tenant_name: email.split('@')[0],
              tenant_email: email,
              is_occupied: true,
              tenant_date_of_entry: new Date().toISOString().split('T')[0]
            })
            .eq('id', invitation.room_id);

          if (updateError) {
            console.error('Error updating room:', updateError);
          }
        }

        // Mark invitation as used
        await supabase
          .from('invitations')
          .update({ is_used: true })
          .eq('id', invitation.id);

        // Get property and room info for display
        const { data: room } = await supabase
          .from('rooms')
          .select(`
            room_number,
            properties (
              name
            )
          `)
          .eq('id', invitation.room_id)
          .single();

        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as Tenant - ${room?.properties?.name}, Room ${room?.room_number}`,
        });
        
        onLogin(email, role);
      } else if (role === 'manager') {
        // For managers, check localStorage for now
        const storedManagerCredentials = JSON.parse(localStorage.getItem('managerCredentials') || '[]');
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
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Please check your email, password, and role selection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
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