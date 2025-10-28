import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeaseDocumentWithDetails {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  tenant_id: string;
  property_name?: string;
  room_number?: string;
  tenant_email?: string;
}

const AllLeaseDocumentsViewer = () => {
  const { toast } = useToast();
  const [leaseDocuments, setLeaseDocuments] = useState<LeaseDocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllLeaseDocuments();
  }, []);

  const fetchAllLeaseDocuments = async () => {
    try {
      setLoading(true);
      
      const { data: leases, error } = await supabase
        .from('lease_documents')
        .select(`
          *,
          rooms!inner(
            room_number,
            property_id,
            properties!inner(name)
          ),
          profiles!inner(email)
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      const transformedData: LeaseDocumentWithDetails[] = (leases || []).map((doc: any) => ({
        id: doc.id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        upload_date: doc.upload_date,
        status: doc.status as "pending" | "approved" | "rejected",
        notes: doc.notes,
        tenant_id: doc.tenant_id,
        property_name: doc.rooms?.properties?.name,
        room_number: doc.rooms?.room_number,
        tenant_email: doc.profiles?.email,
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

  const handleDownload = async (document: LeaseDocumentWithDetails) => {
    try {
      const { data, error } = await supabase.storage
        .from('leases')
        .download(document.file_path);

      if (error) throw error;

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
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lease Agreements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading lease documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Lease Agreements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaseDocuments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No lease documents uploaded yet</div>
        ) : (
          <div className="space-y-4">
            {leaseDocuments.map((document) => (
              <div key={document.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium">{document.file_name}</p>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>{document.property_name}</span>
                        <span>•</span>
                        <span>{document.room_number?.charAt(0).toUpperCase() + document.room_number?.slice(1)}</span>
                        <span>•</span>
                        <span>{document.tenant_email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(document.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(document.upload_date).toLocaleDateString()}
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
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
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
                  <div className="text-sm text-muted-foreground pt-2 border-t">
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

export default AllLeaseDocumentsViewer;
