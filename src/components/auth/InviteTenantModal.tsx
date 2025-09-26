import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, UserPlus } from "lucide-react";

interface InviteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  roomId: string;
  roomNumber: string;
}

const InviteTenantModal = ({ isOpen, onClose, propertyId, roomId, roomNumber }: InviteTenantModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleInviteTenant = async () => {
    if (!email.trim() || !fullName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const password = generatePassword();

    try {
      // Hash the password before storing
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password });

      if (hashError) throw hashError;

      // Create invitation record with hashed password and temporary password for display
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          email,
          password_hash: hashedPassword,
          temporary_password: password, // Store temporarily for sharing
          role: 'tenant',
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          property_id: propertyId,
          room_id: roomId
        }]);

      if (inviteError) throw inviteError;

      setGeneratedPassword(password);
      setInviteSent(true);
      
      toast({
        title: "Tenant Invited",
        description: `Invitation created for ${fullName} in room ${roomNumber}.`,
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Error",
        description: "Failed to create invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const systemLink = window.location.origin;
    const credentials = `System Link: ${systemLink}\nEmail: ${email}\nPassword: ${generatedPassword}\nRoom: ${roomNumber}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Copied",
      description: "Login credentials and link copied to clipboard",
    });
  };

  const handleClose = () => {
    setEmail("");
    setFullName("");
    setGeneratedPassword("");
    setInviteSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Tenant - Room {roomNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!inviteSent ? (
            <>
              <div>
                <Label htmlFor="tenant-name">Full Name</Label>
                <Input
                  id="tenant-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="tenant-email">Email Address</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@example.com"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleInviteTenant} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creating Invitation..." : "Create Invitation"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Tenant Login Credentials</h3>
                <div className="space-y-1">
                  <p><span className="font-medium">System Link:</span> {window.location.origin}</p>
                  <p><span className="font-medium">Name:</span> {fullName}</p>
                  <p><span className="font-medium">Email:</span> {email}</p>
                  <p><span className="font-medium">Password:</span> {generatedPassword}</p>
                  <p><span className="font-medium">Room:</span> {roomNumber}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share these credentials with the tenant. They can use them to log in.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={copyCredentials} className="flex-1">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Credentials
                </Button>
                <Button variant="outline" onClick={handleClose}>
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

export default InviteTenantModal;