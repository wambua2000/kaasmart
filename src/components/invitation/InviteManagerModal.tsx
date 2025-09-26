import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CredentialsDisplay } from "./CredentialsDisplay";
import { Mail, User, Building2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  location: string;
}

interface InviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

export function InviteManagerModal({ isOpen, onClose, properties }: InviteManagerModalProps) {
  const [email, setEmail] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);
  const { toast } = useToast();

  const handleInviteManager = async () => {
    if (!email || !selectedProperty) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedPropertyData = properties.find(p => p.id === selectedProperty);
      
      if (!selectedPropertyData) {
        throw new Error("Selected property not found");
      }

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to send invitations");
      }

      // Call the edge function to create manager invitation
      const { data, error } = await supabase.functions.invoke('send-manager-invitation', {
        body: {
          email,
          propertyId: selectedProperty,
          propertyName: selectedPropertyData.name,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to send invitation");
      }

      // Show credentials
      setCredentials(data.credentials);
      setShowCredentials(true);

    } catch (error: any) {
      console.error("Invitation error:", error);
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send manager invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSelectedProperty("");
    setShowCredentials(false);
    setCredentials(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {showCredentials && credentials ? (
          <CredentialsDisplay 
            credentials={credentials}
            propertyName={properties.find(p => p.id === selectedProperty)?.name || "Property"}
            onClose={handleClose}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Invite Manager
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manager-email">Manager Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="manager-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="Enter manager's email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property-select">Assign to Property</Label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{property.name}</div>
                            <div className="text-xs text-muted-foreground">{property.location}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleInviteManager}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Sending Invitation..." : "Send Invitation"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}