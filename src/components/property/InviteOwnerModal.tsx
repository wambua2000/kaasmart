import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteOwnerModal = ({ isOpen, onClose }: InviteOwnerModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGenerateInvitation = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const password = generatePassword();
      
      // Call the Supabase function to generate invitation credentials
      const { data, error } = await supabase.rpc('generate_invitation_credentials', {
        invitation_email: email,
        invitation_role: 'owner',
        invite_property_id: null,
        invite_room_id: null,
      });

      if (error) {
        console.error('Error generating invitation:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const invitation = data[0];
        setGeneratedCredentials({
          email: invitation.email,
          password: invitation.temporary_password,
        });

        toast({
          title: "Invitation Created",
          description: `Property owner invitation generated for ${email}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const resetModal = () => {
    setEmail("");
    setGeneratedCredentials(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Property Owner</DialogTitle>
          <DialogDescription>
            Generate credentials for a new property owner. They will be able to add and manage their own properties.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {!generatedCredentials ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Owner Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleGenerateInvitation} 
                className="w-full"
                disabled={isLoading}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? "Generating..." : "Generate Owner Credentials"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-foreground">Generated Credentials</h4>
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={generatedCredentials.email} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials.email, 'Email')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={generatedCredentials.password} 
                        readOnly 
                        className="font-mono pr-10"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials.password, 'Password')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-blue-400">
                  <p className="font-medium text-blue-800 dark:text-blue-300">Important:</p>
                  <p className="text-blue-700 dark:text-blue-400">
                    Share these credentials securely with the new owner. They can log in using the "Property Owner" role and will start with an empty dashboard where they can add their properties.
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetModal} className="flex-1">
                  Invite Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteOwnerModal;
