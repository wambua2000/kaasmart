import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Mail, Calendar, FileText, Save } from "lucide-react";
import { z } from "zod";

// Validation schema for tenant profile
const tenantProfileSchema = z.object({
  tenant_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  tenant_email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  tenant_phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number must be less than 20 characters"),
  tenant_notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  tenant_accessories: z.array(z.string()).optional(),
});

interface TenantProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  tenantData: {
    tenant_name?: string;
    tenant_email?: string;
    tenant_phone?: string;
    tenant_notes?: string;
    tenant_accessories?: string[];
    tenant_date_of_entry?: string;
    rent_status?: string;
  };
  userRole: 'tenant' | 'manager' | 'owner';
}

const TenantProfileEditor = ({
  isOpen,
  onClose,
  roomId,
  tenantData,
  userRole
}: TenantProfileEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenant_name: tenantData.tenant_name || "",
    tenant_email: tenantData.tenant_email || "",
    tenant_phone: tenantData.tenant_phone || "",
    tenant_notes: tenantData.tenant_notes || "",
    tenant_accessories: tenantData.tenant_accessories || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      tenantProfileSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          tenant_name: formData.tenant_name,
          tenant_email: formData.tenant_email,
          tenant_phone: formData.tenant_phone,
          tenant_notes: formData.tenant_notes,
          tenant_accessories: formData.tenant_accessories,
        })
        .eq('id', roomId);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Tenant profile has been updated successfully. Changes will sync across all accounts.",
        variant: "default",
      });

      onClose();
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update tenant profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccessoryToggle = (accessory: string) => {
    setFormData(prev => ({
      ...prev,
      tenant_accessories: prev.tenant_accessories.includes(accessory)
        ? prev.tenant_accessories.filter(a => a !== accessory)
        : [...prev.tenant_accessories, accessory]
    }));
  };

  const commonAccessories = ["Bed", "Table", "Chair", "Wardrobe", "Study Desk", "Refrigerator", "TV", "Fan"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Tenant Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="tenant_name"
                  value={formData.tenant_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant_name: e.target.value }))}
                  placeholder="Enter full name"
                  className={errors.tenant_name ? "border-destructive" : ""}
                />
                {errors.tenant_name && (
                  <p className="text-sm text-destructive">{errors.tenant_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="tenant_email"
                  type="email"
                  value={formData.tenant_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant_email: e.target.value }))}
                  placeholder="Enter email address"
                  className={errors.tenant_email ? "border-destructive" : ""}
                />
                {errors.tenant_email && (
                  <p className="text-sm text-destructive">{errors.tenant_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="tenant_phone"
                  value={formData.tenant_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant_phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className={errors.tenant_phone ? "border-destructive" : ""}
                />
                {errors.tenant_phone && (
                  <p className="text-sm text-destructive">{errors.tenant_phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Entry
                </Label>
                <Input
                  value={tenantData.tenant_date_of_entry || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Accessories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Room Accessories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonAccessories.map((accessory) => (
                <Button
                  key={accessory}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAccessoryToggle(accessory)}
                  className={formData.tenant_accessories.includes(accessory) ? "bg-primary text-primary-foreground" : ""}
                >
                  {accessory}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tenant_accessories.map((accessory) => (
                <Badge key={accessory} variant="secondary">
                  {accessory}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <div className="space-y-2">
              <Label htmlFor="tenant_notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Notes
              </Label>
              <Textarea
                id="tenant_notes"
                value={formData.tenant_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, tenant_notes: e.target.value }))}
                placeholder="Any additional notes about the tenant..."
                rows={3}
                className={errors.tenant_notes ? "border-destructive" : ""}
              />
              {errors.tenant_notes && (
                <p className="text-sm text-destructive">{errors.tenant_notes}</p>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Rent Status</Label>
                <Badge variant={tenantData.rent_status === 'paid' ? 'default' : 'destructive'}>
                  {tenantData.rent_status === 'paid' ? 'Paid' : 'Not Paid'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenantProfileEditor;