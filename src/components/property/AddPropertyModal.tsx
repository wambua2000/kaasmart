import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, DollarSign, Home, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Property {
  id: string;
  name: string;
  location: string;
  rent_per_room: number;
  total_rooms: number;
  occupiedRooms: number;
  image_url?: string;
}

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (property: Property) => void;
}

const AddPropertyModal = ({ isOpen, onClose, onAddProperty }: AddPropertyModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rentPerRoom: "",
    totalRooms: "",
    description: "",
    imageUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    setIsSubmitting(true);

    // Validate form
    if (!formData.name.trim() || !formData.location.trim() || !formData.rentPerRoom || !formData.totalRooms) {
      console.log("Validation failed:", { name: formData.name, location: formData.location, rent: formData.rentPerRoom, rooms: formData.totalRooms });
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Validation passed, proceeding to save...");
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("No authenticated user found");
      }
      
      console.log("User authenticated:", user.id);

      // Insert property into database
      console.log("Inserting property into database...");
      const { data: insertedProperty, error: insertError } = await supabase
        .from('properties')
        .insert({
          name: formData.name.trim(),
          location: formData.location.trim(),
          rent_per_room: parseInt(formData.rentPerRoom),
          total_rooms: parseInt(formData.totalRooms),
          owner_id: user.id,
          image_url: formData.imageUrl || "/placeholder.svg",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw insertError;
      }
      
      console.log("Property inserted successfully:", insertedProperty);

      // Notify parent component
      onAddProperty({
        id: insertedProperty.id,
        name: insertedProperty.name,
        location: insertedProperty.location,
        rent_per_room: insertedProperty.rent_per_room,
        total_rooms: insertedProperty.total_rooms,
        occupiedRooms: 0,
        image_url: insertedProperty.image_url || undefined,
      });

      // Reset form
      setFormData({
        name: "",
        location: "",
        rentPerRoom: "",
        totalRooms: "",
        description: "",
        imageUrl: "",
      });

      toast({
        title: "Property Added Successfully",
        description: `${insertedProperty.name} has been added to your portfolio.`,
      });

      onClose();
    } catch (error) {
      console.error("Error adding property:", error);
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      location: "",
      rentPerRoom: "",
      totalRooms: "",
      description: "",
      imageUrl: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Add New Property
          </DialogTitle>
          <DialogDescription>
            Fill in the details to add a new property to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Property Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Skyline Apartments"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              placeholder="e.g., Westlands, Nairobi"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
            />
          </div>

          {/* Rent and Rooms Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentPerRoom" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rent Per Room (KSh) *
              </Label>
              <Input
                id="rentPerRoom"
                type="number"
                placeholder="15000"
                value={formData.rentPerRoom}
                onChange={(e) => handleInputChange("rentPerRoom", e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalRooms" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Total Rooms *
              </Label>
              <Input
                id="totalRooms"
                type="number"
                placeholder="20"
                value={formData.totalRooms}
                onChange={(e) => handleInputChange("totalRooms", e.target.value)}
                required
                min="1"
              />
            </div>
          </div>

          {/* Property Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Property Image URL (Optional)
            </Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/property-image.jpg"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange("imageUrl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use a default property image
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Property Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the property, amenities, etc."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding Property..." : "Add Property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPropertyModal;