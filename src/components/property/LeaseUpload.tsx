import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle, AlertCircle, Download, X } from "lucide-react";
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
}

interface LeaseUploadProps {
  roomId?: string;
  propertyId?: string;
}

const LeaseUpload = ({ roomId, propertyId }: LeaseUploadProps = {}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [leaseDocuments, setLeaseDocuments] = useState<LeaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing lease documents on mount
  useEffect(() => {
    fetchLeaseDocuments();
  }, [roomId, propertyId]);

  const fetchLeaseDocuments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('lease_documents')
        .select('*')
        .eq('tenant_id', user.id)
        .order('upload_date', { ascending: false });

      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedData: LeaseDocument[] = (data || []).map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
        upload_date: doc.upload_date,
        status: doc.status as "pending" | "approved" | "rejected",
        notes: doc.notes,
      }));

      setLeaseDocuments(transformedData);
    } catch (error) {
      console.error('Error fetching lease documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create unique file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('leases')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get current user's room and property info if not provided
      let currentRoomId = roomId;
      let currentPropertyId = propertyId;
      
      if (!currentRoomId || !currentPropertyId) {
        const { data: roomData } = await supabase
          .from('rooms')
          .select('id, property_id')
          .eq('tenant_id', user.id)
          .single();
          
        if (roomData) {
          currentRoomId = roomData.id;
          currentPropertyId = roomData.property_id;
        }
      }

      // Save document metadata to database
      const { data: documentData, error: documentError } = await supabase
        .from('lease_documents')
        .insert({
          tenant_id: user.id,
          room_id: currentRoomId,
          property_id: currentPropertyId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Transform data to match LeaseDocument interface
      const newDocument: LeaseDocument = {
        id: documentData.id,
        file_name: documentData.file_name,
        file_path: documentData.file_path,
        file_size: documentData.file_size,
        upload_date: documentData.upload_date,
        status: documentData.status as "pending" | "approved" | "rejected",
        notes: documentData.notes,
      };

      setLeaseDocuments(prev => [...prev, newDocument]);

      toast({
        title: "Lease Uploaded Successfully",
        description: "Your lease document has been uploaded and is pending review.",
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload lease document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
        description: "Your lease document is being downloaded.",
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

  const handleDelete = async (document: LeaseDocument) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('leases')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('lease_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      setLeaseDocuments(prev => prev.filter(doc => doc.id !== document.id));

      toast({
        title: "Document Deleted",
        description: "Your lease document has been deleted successfully.",
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the document. Please try again.",
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
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
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
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading lease documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section - Compact */}
      <div className="border border-dashed border-border rounded-lg p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Uploading lease document...</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Upload Lease Agreement</p>
                <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (max 10MB)</p>
              </div>
            </div>
            <Button 
              onClick={handleFileSelect}
              size="sm"
              className="bg-gradient-hero hover:shadow-glow"
              disabled={uploading}
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Uploaded Documents - Compact */}
      {leaseDocuments.length > 0 && (
        <div className="space-y-2">
          {leaseDocuments.map((document) => (
            <div key={document.id} className="flex items-center justify-between p-2 border rounded text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{document.file_name}</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {getStatusIcon(document.status)}
                    <span className="capitalize">{document.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(document)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(document)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaseUpload;