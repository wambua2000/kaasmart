import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Mail } from "lucide-react";

interface InviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteManagerModal = ({ isOpen, onClose }: InviteManagerModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
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

  const handleInviteManager = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const password = generatePassword();

    try {
      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          email,
          password,
          role: 'manager',
          invited_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (inviteError) throw inviteError;

      setGeneratedPassword(password);
      setInviteSent(true);
      
      toast({
        title: "Manager Invited",
        description: "Invitation created successfully. Share the credentials below.",
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
    const credentials = `System Link: ${systemLink}\nEmail: ${email}\nPassword: ${generatedPassword}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Copied",
      description: "Login credentials and link copied to clipboard",
    });
  };

  const handleClose = () => {
    setEmail("");
    setGeneratedPassword("");
    setInviteSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!inviteSent ? (
            <>
              <div>
                <Label htmlFor="manager-email">Manager Email</Label>
                <Input
                  id="manager-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@example.com"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleInviteManager} 
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
                <h3 className="font-semibold">Manager Login Credentials</h3>
                <div className="space-y-1">
                  <p><span className="font-medium">System Link:</span> {window.location.origin}</p>
                  <p><span className="font-medium">Email:</span> {email}</p>
                  <p><span className="font-medium">Password:</span> {generatedPassword}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share these credentials with the manager. They can use them to log in.
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

export default InviteManagerModal;