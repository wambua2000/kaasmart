import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, DollarSign, Home, ImageIcon, Upload } from "lucide-react";
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

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onUpdateProperty: (property: Property) => void;
}

const EditPropertyModal = ({ isOpen, onClose, property, onUpdateProperty }: EditPropertyModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rentPerRoom: "",
    totalRooms: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        location: property.location,
        rentPerRoom: property.rent_per_room.toString(),
        totalRooms: property.total_rooms.toString(),
        imageUrl: property.image_url || "",
      });
    }
  }, [property]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('leases')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('leases')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    
    setIsSubmitting(true);

    // Validate form
    if (!formData.name.trim() || !formData.location.trim() || !formData.rentPerRoom || !formData.totalRooms) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Validate numeric values
    const rentValue = parseFloat(formData.rentPerRoom);
    const roomsValue = parseInt(formData.totalRooms);

    if (isNaN(rentValue) || rentValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Rent per room must be a valid positive number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (isNaN(roomsValue) || roomsValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Total rooms must be a valid positive number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast({
            title: "Image Upload Failed",
            description: "Failed to upload image. Continuing with existing image.",
            variant: "destructive",
          });
        }
      }

      // Update property in database
      const { data, error } = await supabase
        .from('properties')
        .update({
          name: formData.name.trim(),
          location: formData.location.trim(),
          rent_per_room: rentValue,
          total_rooms: roomsValue,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message || 'Failed to update property');
      }

      const updatedProperty: Property = {
        ...property,
        name: formData.name.trim(),
        location: formData.location.trim(),
        rent_per_room: rentValue,
        total_rooms: roomsValue,
        image_url: imageUrl,
      };

      onUpdateProperty(updatedProperty);

      toast({
        title: "Success!",
        description: `${updatedProperty.name} has been updated successfully.`,
      });

      setImageFile(null);
      onClose();
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setImageFile(null);
    onClose();
  };

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Property
          </DialogTitle>
          <DialogDescription>
            Update the property details below.
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

          {/* Property Image */}
          <div className="space-y-2">
            <Label htmlFor="imageFile" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Property Image
            </Label>
            <div className="space-y-3">
              {formData.imageUrl && !imageFile && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img
                    src={formData.imageUrl}
                    alt="Current property"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {imageFile && (
                <p className="text-sm text-primary">
                  New image selected: {imageFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPropertyModal;
