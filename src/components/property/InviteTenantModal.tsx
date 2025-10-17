import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, Lock, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantInvited: (tenantData: {
    email: string;
    password: string;
    propertyName: string;
    roomNumber: string;
    name: string;
    dateOfEntry: string;
  }) => void;
  propertyName: string;
  roomNumber: string;
}

const InviteTenantModal = ({ 
  isOpen, 
  onClose, 
  onTenantInvited, 
  propertyName, 
  roomNumber 
}: InviteTenantModalProps) => {
  const { toast } = useToast();
  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [dateOfEntry, setDateOfEntry] = useState(new Date().toISOString().split('T')[0]);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address (e.g., tenant@gmail.com)");
      return false;
    }
    if (email.includes('@kaasmart.com')) {
      setEmailError("Please use a real email address (Gmail, Yahoo, Outlook, etc.)");
      return false;
    }
    setEmailError("");
    return true;
  };

  const generateTenantCredentials = () => {
    if (!tenantName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the tenant's name first.",
        variant: "destructive",
      });
      return;
    }

    if (!tenantEmail.trim() || !validateEmail(tenantEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid real email address.",
        variant: "destructive",
      });
      return;
    }

    // Generate random password
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const credentials = { email: tenantEmail, password };
    setGeneratedCredentials(credentials);

    toast({
      title: "Credentials Generated",
      description: "Tenant login credentials have been generated successfully.",
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleInviteTenant = () => {
    if (!generatedCredentials || !tenantName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please generate credentials and enter tenant name.",
        variant: "destructive",
      });
      return;
    }

    onTenantInvited({
      ...generatedCredentials,
      propertyName,
      roomNumber,
      name: tenantName,
      dateOfEntry,
    });

    // Reset form
    setTenantName("");
    setDateOfEntry(new Date().toISOString().split('T')[0]);
    setGeneratedCredentials(null);
    onClose();
  };

  const handleClose = () => {
    setTenantName("");
    setTenantEmail("");
    setEmailError("");
    setDateOfEntry(new Date().toISOString().split('T')[0]);
    setGeneratedCredentials(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Invite Tenant - {propertyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Room Assignment</h4>
            <p className="text-sm text-muted-foreground">
              Property: <span className="font-medium">{propertyName}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Room: <span className="font-medium">{roomNumber}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tenantName">Tenant Name *</Label>
              <Input
                id="tenantName"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Enter tenant's full name"
              />
            </div>

            <div>
              <Label htmlFor="tenantEmail">Tenant Email *</Label>
              <Input
                id="tenantEmail"
                type="email"
                value={tenantEmail}
                onChange={(e) => {
                  setTenantEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="tenant@gmail.com"
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1">{emailError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Use a real email address (Gmail, Yahoo, Outlook, etc.)
              </p>
            </div>

            <div>
              <Label htmlFor="dateOfEntry">Date of Entry</Label>
              <Input
                id="dateOfEntry"
                type="date"
                value={dateOfEntry}
                onChange={(e) => setDateOfEntry(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={generateTenantCredentials}
              className="bg-gradient-hero hover:shadow-glow"
              disabled={!tenantName.trim() || !tenantEmail.trim()}
            >
              Generate Login Credentials
            </Button>
          </div>

          {generatedCredentials && (
            <div className="space-y-4 bg-accent/10 p-4 rounded-lg border border-accent/20">
              <h4 className="font-medium text-center">Generated Credentials</h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={generatedCredentials.email} 
                      readOnly 
                      className="bg-background"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials.email, "Email")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Password</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={generatedCredentials.password} 
                      readOnly 
                      className="bg-background"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials.password, "Password")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-background p-3 rounded border">
                <p className="font-medium mb-2">⚠️ Important Instructions:</p>
                <ul className="space-y-1">
                  <li>• Share these credentials securely with the tenant</li>
                  <li>• Tenant should use these to login to the system</li>
                  <li>• These credentials are case-sensitive</li>
                  <li>• Store these credentials safely as they cannot be recovered</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleInviteTenant} 
              className="flex-1 bg-gradient-hero hover:shadow-glow"
              disabled={!generatedCredentials}
            >
              Invite Tenant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteTenantModal;