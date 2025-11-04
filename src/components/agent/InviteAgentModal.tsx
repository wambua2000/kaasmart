import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  name: string;
  location: string;
}

interface InviteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onAgentInvited: (agentData: {
    email: string;
    password: string;
    scope: 'all' | 'single';
    propertyId?: string;
    propertyName?: string;
  }) => void;
}

export const InviteAgentModal = ({ 
  isOpen, 
  onClose, 
  properties,
  onAgentInvited 
}: InviteAgentModalProps) => {
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState<'all' | 'single'>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const { toast } = useToast();

  const generatePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    
    let password = '';
    for (let i = 0; i < 4; i++) {
      password += upper.charAt(Math.floor(Math.random() * upper.length));
    }
    for (let i = 0; i < 4; i++) {
      password += lower.charAt(Math.floor(Math.random() * lower.length));
    }
    return password;
  };

  const handleInvite = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (scope === 'single' && !selectedPropertyId) {
      toast({
        title: "Property Required",
        description: "Please select a property for the agent",
        variant: "destructive",
      });
      return;
    }

    const password = generatePassword();
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    
    setCredentials({ email, password });
    
    onAgentInvited({
      email,
      password,
      scope,
      propertyId: scope === 'single' ? selectedPropertyId : undefined,
      propertyName: selectedProperty?.name,
    });
  };

  const handleCopyEmail = () => {
    if (credentials) {
      navigator.clipboard.writeText(credentials.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPassword = () => {
    if (credentials) {
      navigator.clipboard.writeText(credentials.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail("");
    setScope('all');
    setSelectedPropertyId("");
    setCredentials(null);
    setCopiedEmail(false);
    setCopiedPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Financial Agent</DialogTitle>
          <DialogDescription>
            Invite an agent to handle rent collection and financial reports
          </DialogDescription>
        </DialogHeader>

        {!credentials ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Agent Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="scope">Access Scope</Label>
              <Select value={scope} onValueChange={(value: 'all' | 'single') => setScope(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="single">Single Property</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope === 'single' && (
              <div>
                <Label htmlFor="property">Property</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleInvite} className="bg-emerald-600 hover:bg-emerald-700">
                Send Invitation
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <h3 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-300">Agent Invitation Sent!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share these credentials with the agent:
              </p>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Email</Label>
                  <div className="flex gap-2">
                    <Input value={credentials.email} readOnly className="font-mono" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyEmail}
                    >
                      {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input value={credentials.password} readOnly className="font-mono" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyPassword}
                    >
                      {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                The agent can use these credentials to log in. They should change their password after first login.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
