import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeaseDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  tenant_id: string;
}

interface RoomLeaseViewerProps {
  roomId?: string;
  tenantId?: string;
  roomNumber: string;
}

const RoomLeaseViewer = ({ roomId, tenantId, roomNumber }: RoomLeaseViewerProps) => {
  const { toast } = useToast();
  const [leaseDocuments, setLeaseDocuments] = useState<LeaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchLeaseDocuments();
    } else {
      setLoading(false);
    }
  }, [tenantId, roomId]);

  const fetchLeaseDocuments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('lease_documents')
        .select('*')
        .order('upload_date', { ascending: false });

      // Filter by tenant_id if provided, or room_id if provided
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching lease documents:', error);
        throw error;
      }

      // Transform the data to match LeaseDocument interface
      const transformedData: LeaseDocument[] = (data || []).map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        upload_date: doc.upload_date,
        status: doc.status as "pending" | "approved" | "rejected",
        notes: doc.notes,
        tenant_id: doc.tenant_id,
      }));

      setLeaseDocuments(transformedData);
    } catch (error) {
      console.error('Error fetching lease documents:', error);
      toast({
        title: "Error",
        description: "Failed to load lease documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: LeaseDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('leases')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Lease document is being downloaded.",
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: "approved" | "rejected", notes?: string) => {
    try {
      const { error } = await supabase
        .from('lease_documents')
        .update({ 
          status: newStatus,
          notes: notes 
        })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setLeaseDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: newStatus, notes: notes } 
            : doc
        )
      );

      toast({
        title: "Status Updated",
        description: `Document ${newStatus} successfully.`,
      });

    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update document status.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-orange-500";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lease Documents - {roomNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!tenantId) {
    return (
      <Card className="bg-card/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lease Documents - {roomNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Room is vacant</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Lease Documents - {roomNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaseDocuments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No lease documents uploaded</div>
        ) : (
          <div className="space-y-3">
            {leaseDocuments.map((document) => (
              <div key={document.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{document.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(document.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(document.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(document.status)}
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(document)}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Action buttons for owners/managers */}
                {document.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDocumentStatus(document.id, "approved")}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDocumentStatus(document.id, "rejected", "Document requires revision")}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                )}
                
                {document.notes && (
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    <strong>Notes:</strong> {document.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomLeaseViewer;