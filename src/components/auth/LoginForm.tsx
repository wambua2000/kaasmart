import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useInvitationAuth } from "./InvitationAuth";
import kaasmartLogo from "@/assets/kaasmart-logo.png";

export type UserRole = "owner" | "manager" | "tenant";

interface LoginFormProps {
  onLogin: (email: string, role: UserRole) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Use invitation auth hook
  useInvitationAuth();

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

    try {
      // First try to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = profile?.role || 'owner';
        
        toast({
          title: "Welcome to KaaSmart!",
          description: `Logged in as ${userRole === 'owner' ? 'Property Owner' : userRole === 'manager' ? 'Manager' : 'Tenant'}`,
        });
        
        onLogin(email, userRole as UserRole);
      }
    } catch (error) {
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
                className="w-full bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button variant="link" className="text-primary hover:text-primary-glow">
                  Forgot Password?
                </Button>
              </div>
            </form>

            {/* Info for invited users */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-2">New User?</p>
              <p className="text-muted-foreground">
                If you've been invited as a manager or tenant, use the email and password provided in your invitation.
              </p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default LoginForm;