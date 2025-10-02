import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wrench, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceRequestFormProps {
  tenantId: string;
  propertyId?: string;
  roomId?: string;
  onRequestSubmitted?: () => void;
}

const MaintenanceRequestForm = ({ 
  tenantId, 
  propertyId, 
  roomId, 
  onRequestSubmitted 
}: MaintenanceRequestFormProps) => {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState<'plumbing' | 'electrical' | 'appliance' | 'structural' | 'other'>('other');
  const [loading, setLoading] = useState(false);

  const submitMaintenanceRequest = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please describe the maintenance issue",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const messageText = `[MAINTENANCE REQUEST - ${priority.toUpperCase()} PRIORITY]
Category: ${category.charAt(0).toUpperCase() + category.slice(1)}

${description}

Status: Pending Review`;

      // Get property owner to send maintenance request to
      let receiverId = null;
      if (propertyId) {
        const { data: property } = await supabase
          .from('properties')
          .select('owner_id')
          .eq('id', propertyId)
          .single();
        receiverId = property?.owner_id;
      }

      const { error } = await supabase
        .from('messages')
        .insert([{
          content: messageText,
          message: messageText, // Keep for backward compatibility
          sender_id: tenantId,
          receiver_id: receiverId,
          property_id: propertyId || null,
          room_id: roomId || null,
          type: 'maintenance'
        }]);

      if (error) throw error;

      setDescription("");
      setPriority('medium');
      setCategory('other');
      
      toast({
        title: "Maintenance Request Submitted",
        description: "Your request has been sent to the property management team"
      });

      onRequestSubmitted?.();
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast({
        title: "Error",
        description: "Failed to submit maintenance request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Submit Maintenance Request
        </CardTitle>
        <CardDescription>
          Report any maintenance issues in your room or common areas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="appliance">Appliance</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon('low')}
                    Low Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon('medium')}
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon('high')}
                    High Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe the maintenance issue in detail. Include location, what's not working, and any relevant details..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            {getPriorityIcon(priority)}
            Priority Level: {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </h4>
          <p className="text-xs text-muted-foreground">
            {priority === 'high' && "Urgent issues requiring immediate attention (safety hazards, major leaks)"}
            {priority === 'medium' && "Standard maintenance issues (minor repairs, replacements)"}
            {priority === 'low' && "Non-urgent requests that can be scheduled at convenience"}
          </p>
        </div>

        <Button 
          onClick={submitMaintenanceRequest}
          disabled={!description.trim() || loading}
          className="w-full bg-gradient-hero hover:shadow-glow"
        >
          <Wrench className="mr-2 h-4 w-4" />
          {loading ? 'Submitting...' : 'Submit Maintenance Request'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MaintenanceRequestForm;