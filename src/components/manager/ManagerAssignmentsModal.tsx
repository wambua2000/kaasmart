import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Property {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  email: string;
  full_name?: string;
}

interface Assignment {
  id: string;
  manager_id: string;
  property_id: string | null;
  can_manage_all: boolean;
  manager: Manager;
  property: Property | null;
}

interface ManagerAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
}

export const ManagerAssignmentsModal = ({ isOpen, onClose, properties }: ManagerAssignmentsModalProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssignments();
      fetchManagers();
    }
  }, [isOpen]);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('manager_properties')
      .select(`
        id,
        manager_id,
        property_id,
        can_manage_all,
        manager:manager_id (id, email, full_name),
        property:property_id (id, name)
      `);

    if (error) {
      console.error('Error fetching assignments:', error);
      return;
    }

    setAssignments(data as any);
  };

  const fetchManagers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'manager');

    if (error) {
      console.error('Error fetching managers:', error);
      return;
    }

    setManagers(data);
  };

  const handleAddAssignment = async () => {
    if (!selectedManager) {
      toast({
        title: "Error",
        description: "Please select a manager",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('manager_properties')
      .insert({
        manager_id: selectedManager,
        property_id: selectedProperty === "all" ? null : selectedProperty,
        can_manage_all: selectedProperty === "all",
        assigned_by: session?.user.id,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add assignment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Manager assignment added",
    });

    setSelectedManager("");
    setSelectedProperty("");
    fetchAssignments();
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('manager_properties')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Manager assignment removed",
    });

    fetchAssignments();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Manager Assignments</DialogTitle>
          <DialogDescription>
            Assign managers to specific properties or give them access to all properties
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Add New Assignment</CardTitle>
            <CardDescription>Assign a manager to a property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Manager</label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name || manager.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Property</label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddAssignment} disabled={loading} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Assignment
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Assignments</h3>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No assignments yet</p>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {(assignment.manager as any).full_name || (assignment.manager as any).email}
                    </p>
                    <div className="flex items-center gap-2">
                      {assignment.can_manage_all ? (
                        <Badge variant="secondary">All Properties</Badge>
                      ) : (
                        <Badge variant="outline">
                          {(assignment.property as any)?.name || 'Unknown Property'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
