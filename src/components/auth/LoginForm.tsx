import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroApartment from "@/assets/hero-apartment.jpg";
import apartmentInterior from "@/assets/apartment-interior.jpg";
import loginBackground from "@/assets/login-background.jpg";

export type UserRole = "owner" | "manager" | "tenant";

interface LoginFormProps {
  onLogin: (email: string, role: UserRole) => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [currentImage, setCurrentImage] = useState(0);
  const { toast } = useToast();

  const images = [heroApartment, apartmentInterior];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    // Demo credentials
    const validCredentials = {
      owner: { email: "owner@kaasmart.com", password: "admin123" },
      manager: { email: "manager@kaasmart.com", password: "manager123" },
      tenant: { email: "tenant@kaasmart.com", password: "tenant123" },
    };

    const creds = validCredentials[role];
    if (email === creds.email && password === creds.password) {
      toast({
        title: "Welcome to KaaSmart!",
        description: `Logged in as ${role === 'owner' ? 'Property Owner' : role === 'manager' ? 'Manager' : 'Tenant'}`,
      });
      onLogin(email, role);
    } else {
      toast({
        title: "Invalid Credentials",
        description: "Please check your email, password, and role selection.",
        variant: "destructive",
      });
    }
  };

  // Auto-cycle images every 5 seconds
  setTimeout(() => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  }, 5000);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Image Slideshow */}
        <div className="hidden md:block">
          <div className="relative rounded-2xl overflow-hidden shadow-warm">
            <img
              src={images[currentImage]}
              alt="Beautiful African apartment"
              className="w-full h-[500px] object-cover transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Premium Property Management</h2>
              <p className="text-white/90">Experience seamless property management with KaaSmart</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-hero w-fit">
              <Building2 className="h-8 w-8 text-white" />
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

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-muted-foreground">
                <p><strong>Owner:</strong> owner@kaasmart.com / admin123</p>
                <p><strong>Manager:</strong> manager@kaasmart.com / manager123</p>
                <p><strong>Tenant:</strong> tenant@kaasmart.com / tenant123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;