import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail, Eye, EyeOff, Settings, DollarSign, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import kaasmartLogo from "@/assets/kaasmart-logo.png";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "owner" | "manager" | "tenant" | "developer" | "agent";

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

    // Try Supabase authentication first for all roles
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authData?.user && !authError) {
        // Fetch user profile to verify role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email, full_name, phone')
          .eq('id', authData.user.id)
          .single();

        if (!profileError && profile) {
          // Verify the role matches what user selected
          if (profile.role === role) {
            // For tenants, fetch their room/property info
            if (role === 'tenant') {
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
                .eq('tenant_id', authData.user.id)
                .single();

              toast({
                title: "Welcome to KaaSmart!",
                description: `Logged in as Tenant`,
              });
            } else {
              toast({
                title: "Welcome to KaaSmart!",
                description: `Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
              });
            }
            onLogin(email, role);
            return;
          } else {
            toast({
              title: "Invalid Role",
              description: `This account is registered as ${profile.role}, not ${role}.`,
              variant: "destructive",
            });
            await supabase.auth.signOut();
            return;
          }
        }
      }
    } catch (error) {
      console.error('Supabase auth error:', error);
    }

    // Check invitations table for new users
    try {
      const { data, error } = await supabase.rpc('verify_invitation_login', {
        login_email: email,
        login_password: password
      });

      if (!error && data && data.length > 0 && data[0].user_role === role) {
        const invitationData = data[0];
        
        // Try to sign in first (in case account already exists)
        let authResult = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        // If sign in fails, create new Supabase auth account
        if (authResult.error) {
          authResult = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                role: invitationData.user_role,
                invitation_id: invitationData.invitation_id
              }
            }
          });
        }

        // Mark invitation as used
        if (authResult.data.user && !authResult.error) {
          await supabase.rpc('use_invitation', {
            invitation_id: invitationData.invitation_id
          });

          toast({
            title: "Welcome to KaaSmart!",
            description: `Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          });
          onLogin(email, role);
          return;
        } else if (authResult.error) {
          toast({
            title: "Authentication Error",
            description: authResult.error.message,
            variant: "destructive",
          });
          return;
        }
      }
    } catch (error) {
      console.error('Invitation login error:', error);
    }

    // If we get here, authentication failed
    toast({
      title: "Invalid Credentials",
      description: "Please check your email, password, and selected role.",
      variant: "destructive",
    });
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
                    <SelectItem value="agent">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial Agent
                      </div>
                    </SelectItem>
                    <SelectItem value="developer">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Developer
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