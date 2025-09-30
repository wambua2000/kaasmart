import { useState } from "react";
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

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateNextOwnerEmail = async () => {
    // Fetch all existing property owners to determine the next number
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'owner');
    
    const nextNumber = (count || 0) + 1;
    return `owner${String(nextNumber).padStart(3, '0')}@kaasmart.com`;
  };

  const generateCredentials = async () => {
    setIsGenerating(true);

    try {
      // Generate the next owner email automatically
      const ownerEmail = await generateNextOwnerEmail();

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
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to automatically generate unique login credentials for a new property owner.
              </p>
              <Button
                onClick={generateCredentials}
                disabled={isGenerating}
                className="w-full bg-gradient-hero"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Credentials"}
              </Button>
            </div>
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