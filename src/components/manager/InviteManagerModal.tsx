import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Mail, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  name: string;
}

interface InviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onManagerInvited: (managerData: {
    email: string;
    password: string;
    scope: 'all' | 'single';
    propertyId?: string;
    propertyName?: string;
  }) => void;
}

const InviteManagerModal = ({ isOpen, onClose, properties, onManagerInvited }: InviteManagerModalProps) => {
  const [inviteType, setInviteType] = useState<'all' | 'single'>('single');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [managerEmail, setManagerEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const validateEmail = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(managerEmail)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    if (managerEmail.includes('@kaasmart.com')) {
      setEmailError("Please use a real email address (Gmail, Yahoo, Outlook, etc.)");
      return false;
    }
    setEmailError("");
    return true;
  };

  const generateCredentials = () => {
    if (!managerEmail.trim() || !validateEmail()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid real email address.",
        variant: "destructive",
      });
      return;
    }

    let propertyName = '';
    
    if (inviteType === 'all') {
      propertyName = 'All Properties';
    } else {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      if (!selectedProperty) {
        toast({
          title: "Error",
          description: "Please select a property first.",
          variant: "destructive",
        });
        return;
      }
      propertyName = selectedProperty.name;
    }

    const password = generatePassword();
    
    const credentials = { email: managerEmail, password };
    setGeneratedCredentials(credentials);

    // Call the callback to register the credentials in the system
    onManagerInvited({
      email: managerEmail,
      password,
      scope: inviteType,
      propertyId: inviteType === 'single' ? selectedPropertyId : undefined,
      propertyName,
    });

    toast({
      title: "Manager Credentials Generated",
      description: `Credentials created for ${propertyName}`,
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const resetModal = () => {
    setInviteType('single');
    setSelectedPropertyId('');
    setManagerEmail('');
    setEmailError('');
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
          <DialogTitle>Invite Manager</DialogTitle>
          <DialogDescription>
            Generate credentials for a property manager. Choose to manage a specific property or all properties.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {!generatedCredentials ? (
            <>
              <div className="space-y-4">
                <Label>Manager Scope</Label>
                <RadioGroup 
                  value={inviteType} 
                  onValueChange={(value: 'all' | 'single') => setInviteType(value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">Manage specific property</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">Manage all properties</Label>
                  </div>
                </RadioGroup>
              </div>

              {inviteType === 'single' && (
                <div className="space-y-2">
                  <Label>Select Property</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="manager-email">Manager Email *</Label>
                <Input
                  id="manager-email"
                  type="email"
                  value={managerEmail}
                  onChange={(e) => {
                    setManagerEmail(e.target.value);
                    setEmailError("");
                  }}
                  placeholder="manager@gmail.com"
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  ⚠️ Use a real email address (Gmail, Yahoo, Outlook, etc.)
                </p>
              </div>

              <Button 
                onClick={generateCredentials} 
                className="w-full"
                disabled={!managerEmail.trim() || (inviteType === 'single' && !selectedPropertyId)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Generate Manager Credentials
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
                  <Label>Password</Label>
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

                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <p className="font-medium text-blue-800">Important:</p>
                  <p className="text-blue-700">
                    Share these credentials securely with the manager. They can now log in using the "Manager/Caretaker" role.
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetModal} className="flex-1">
                  Generate Another
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

export default InviteManagerModal;