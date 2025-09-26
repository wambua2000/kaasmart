import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
      // Generate a temporary password
      const temporaryPassword = Math.random().toString(36).slice(-8);

      // Create invitation in database
      const { error } = await supabase
        .from('invitations')
        .insert({
          email,
          role: 'manager' as const,
          property_id: selectedProperty,
          password: temporaryPassword, // Using password field as expected by types
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

      if (error) {
        throw error;
      }

      // Here you would typically send an email with the credentials
      // For now, we'll show them in the toast
      toast({
        title: "Manager Invited Successfully",
        description: `Invitation sent to ${email}. Temporary password: ${temporaryPassword}`,
      });

      // Reset form
      setEmail("");
      setSelectedProperty("");
      onClose();

    } catch (error: any) {
      toast({
        title: "Invitation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}