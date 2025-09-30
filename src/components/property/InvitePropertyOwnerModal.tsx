import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvitePropertyOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOwnerInvited: () => void;
}

const InvitePropertyOwnerModal = ({
  isOpen,
  onClose,
  onOwnerInvited,
}: InvitePropertyOwnerModalProps) => {
  const { toast } = useToast();
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nextOwnerNumber, setNextOwnerNumber] = useState<number>(1);

  // Fetch next available owner number when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNextOwnerNumber();
    }
  }, [isOpen]);

  const fetchNextOwnerNumber = async () => {
    try {
      // Get all existing owners to determine the next number
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'owner')
        .like('email', 'owner%@kaasmart.com');

      if (error) throw error;

      // Extract numbers from existing owner emails
      const existingNumbers = (profiles || [])
        .map(p => {
          const match = p.email.match(/owner(\d+)@kaasmart\.com/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);

      // Find the next available number
      const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      setNextOwnerNumber(maxNumber + 1);
    } catch (error) {
      console.error('Error fetching owner count:', error);
      setNextOwnerNumber(1);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateCredentials = async () => {
    setIsGenerating(true);

    try {
      // Generate email in format owner001@kaasmart.com
      const ownerEmail = `owner${String(nextOwnerNumber).padStart(3, '0')}@kaasmart.com`;

      // Call Supabase RPC to generate invitation
      const { data, error } = await supabase.rpc('generate_invitation_credentials', {
        invitation_email: ownerEmail,
        invitation_role: 'owner',
      });

      if (error) throw error;

      setGeneratedCredentials({
        email: ownerEmail,
        password: data[0].temporary_password,
      });

      toast({
        title: "Credentials Generated",
        description: "Property owner credentials have been created",
      });

      onOwnerInvited();
    } catch (error: any) {
      console.error('Error generating credentials:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate credentials",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const resetModal = () => {
    setGeneratedCredentials(null);
    setShowPassword(false);
    fetchNextOwnerNumber();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Property Owner</DialogTitle>
          <DialogDescription>
            Generate login credentials for a new property owner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedCredentials ? (
            <>
              <div className="space-y-2">
                <Label>Next Property Owner Email</Label>
                <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                  <p className="text-sm font-mono">
                    owner{String(nextOwnerNumber).padStart(3, '0')}@kaasmart.com
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  This email will be automatically generated for the new property owner
                </p>
              </div>

              <Button
                onClick={generateCredentials}
                disabled={isGenerating}
                className="w-full bg-gradient-hero"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Credentials"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedCredentials.email}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials.email, "Email")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={generatedCredentials.password}
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials.password, "Password")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-2 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Share these credentials securely with the property owner</li>
                    <li>They can log in as "Property Owner" with these credentials</li>
                    <li>Their dashboard will initially have no properties</li>
                    <li>They can add properties using the "Add Property" button</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    resetModal();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Generate Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvitePropertyOwnerModal;
