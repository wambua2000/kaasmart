import { useState, useEffect } from "react";
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
      // Check if this is an invitation-based login (tenant or manager)
      if (role === 'tenant' || role === 'manager') {
        // Check for invitation credentials first
        const { data: invitation } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', email)
          .eq('role', role)
          .eq('is_used', false)
          .maybeSingle();

        if (invitation && invitation.temporary_password === password) {
          // Valid invitation login - create Supabase user account
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                role: role,
                full_name: email.split('@')[0], // Use email prefix as name for now
              }
            }
          });

          if (signUpError) {
            // User might already exist, try signing in instead
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (signInError) {
              toast({
                title: "Authentication Error",
                description: "Invalid credentials or account creation failed.",
                variant: "destructive",
              });
              return;
            }
          }

          // Update invitation as used and get property/room info
          await supabase
            .from('invitations')
            .update({ is_used: true })
            .eq('id', invitation.id);

          // If tenant, update room information
          if (role === 'tenant' && invitation.room_id) {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              await supabase
                .from('rooms')
                .update({
                  tenant_id: userData.user.id,
                  tenant_email: email,
                  tenant_name: email.split('@')[0], // Use email prefix for now
                  is_occupied: true,
                  tenant_date_of_entry: new Date().toISOString().split('T')[0]
                })
                .eq('id', invitation.room_id);

              // Get property and room info for display
              const { data: roomData } = await supabase
                .from('rooms')
                .select(`
                  room_number,
                  properties!inner(name)
                `)
                .eq('id', invitation.room_id)
                .single();

              toast({
                title: "Welcome to KaaSmart!",
                description: `Logged in as Tenant - ${roomData?.properties?.name}, Room ${roomData?.room_number}`,
              });
            }
          } else {
            toast({
              title: "Welcome to KaaSmart!",
              description: `Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            });
          }

          onLogin(email, role);
          return;
        }

        // If no valid invitation found, check if user exists and try normal login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          toast({
            title: "Invalid Credentials",
            description: `${role.charAt(0).toUpperCase() + role.slice(1)} credentials not found. Please contact the property owner for access.`,
            variant: "destructive",
          });
          return;
        }

        // Successful login for existing user
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        });
        onLogin(email, role);

      } else if (role === 'owner') {
        // For owner, use demo credentials for now
        const validCredentials = { email: "owner@kaasmart.com", password: "admin123" };
        
        if (email === validCredentials.email && password === validCredentials.password) {
          toast({
            title: "Welcome to KaaSmart!",
            description: "Logged in as Property Owner",
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
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
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