import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail, Eye, EyeOff, Settings, DollarSign, Loader2, Home } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    setIsLoading(true);
    console.log('🔐 Login attempt:', { email, selectedRole: role });

    // Try Supabase authentication first for all roles
    try {
      console.log('📡 Attempting Supabase auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      console.log('📡 Auth result:', { 
        success: !!authData?.user, 
        userId: authData?.user?.id,
        errorCode: authError?.status,
        errorMessage: authError?.message 
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('Invalid login credentials')) {
          console.log('❌ Invalid credentials - wrong email or password');
          toast({
            title: "Wrong Email or Password",
            description: "The email or password you entered is incorrect. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        } else if (authError.message.includes('Email not confirmed')) {
          console.log('❌ Email not confirmed');
          toast({
            title: "Email Not Confirmed",
            description: "Please check your email and confirm your account first.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        } else {
          console.log('❌ Other auth error:', authError.message);
          // Don't return yet - try invitation login
        }
      }

      if (authData?.user && !authError) {
        console.log('✅ Auth successful, fetching profile...');
        
        // Fetch user profile to verify role
        const { data: profile, error: profileError } = await supabase
          .from('profiles' as any)
          .select('role, email, full_name, phone')
          .eq('id', authData.user.id)
          .single() as any;

        console.log('📋 Profile result:', { 
          found: !!profile, 
          profileRole: profile?.role,
          selectedRole: role,
          error: profileError?.message 
        });

        if (profileError) {
          console.log('❌ Profile fetch error:', profileError.message);
          toast({
            title: "Profile Error",
            description: "Could not fetch your profile. Please try again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (profile) {
          // Verify the role matches what user selected
          if (profile.role === role) {
            console.log('✅ Role matches! Logging in...');
            
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
            setIsLoading(false);
            return;
          } else {
            console.log('❌ Role mismatch! Profile role:', profile.role, 'Selected role:', role);
            toast({
              title: "Wrong Role Selected",
              description: `This account is registered as "${profile.role}". Please select "${profile.role}" from the dropdown.`,
              variant: "destructive",
            });
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error('❌ Supabase auth exception:', error);
    }

    // Check invitations table for new users
    console.log('🔍 Checking invitations table...');
    try {
      const { data, error } = await supabase.rpc('verify_invitation_login' as any, {
        login_email: email,
        login_password: password
      });

      console.log('📧 Invitation check result:', { 
        found: data && data.length > 0,
        invitationRole: data?.[0]?.user_role,
        selectedRole: role,
        error: error?.message 
      });

      if (!error && data && data.length > 0 && data[0].user_role === role) {
        const invitationData = data[0];
        console.log('✅ Valid invitation found, creating account...');
        
        // Try to sign in first (in case account already exists)
        let authResult = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        // If sign in fails, create new Supabase auth account
        if (authResult.error) {
          console.log('📝 Creating new auth account...');
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
          await supabase.rpc('use_invitation' as any, {
            invitation_id: (invitationData as any).invitation_id
          });

          console.log('✅ Invitation login successful!');
          toast({
            title: "Welcome to KaaSmart!",
            description: `Logged in as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          });
          onLogin(email, role);
          setIsLoading(false);
          return;
        } else if (authResult.error) {
          console.log('❌ Auth error during invitation login:', authResult.error.message);
          toast({
            title: "Authentication Error",
            description: authResult.error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else if (data && data.length > 0 && data[0].user_role !== role) {
        console.log('❌ Invitation role mismatch! Invitation role:', data[0].user_role, 'Selected role:', role);
        toast({
          title: "Wrong Role Selected",
          description: `Your invitation is for "${data[0].user_role}". Please select that role from the dropdown.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('❌ Invitation login exception:', error);
    }

    // If we get here, authentication failed
    console.log('❌ All authentication methods failed');
    toast({
      title: "Login Failed",
      description: "Invalid email, password, or role. Please check your credentials and try again.",
      variant: "destructive",
    });
    setIsLoading(false);
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
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)} disabled={isLoading}>
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
                    <SelectItem value="agent">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Agent
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Button 
                  type="button"
                  variant="link" 
                  className="text-primary hover:text-primary-glow"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  disabled={isLoading}
                >
                  Forgot Password?
                </Button>
                <div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/")}
                    disabled={isLoading}
                  >
                    <Home className="mr-1 h-3 w-3" />
                    Return to Home Page
                  </Button>
                </div>
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
