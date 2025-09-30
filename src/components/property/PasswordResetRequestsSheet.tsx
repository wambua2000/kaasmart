import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Check, X, Clock, Copy } from "lucide-react";
import { format } from "date-fns";

interface PasswordResetRequest {
  id: string;
  email: string;
  user_role: string;
  status: string;
  created_at: string;
  completed_at?: string;
  new_password?: string;
  notes?: string;
}

interface PasswordResetRequestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordResetRequestsSheet = ({ open, onOpenChange }: PasswordResetRequestsSheetProps) => {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      toast({
        title: "Error",
        description: "Failed to load password reset requests.",
        variant: "destructive",
      });
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !newPassword) {
      toast({
        title: "Missing Information",
        description: "Please generate a new password first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'completed',
          new_password: newPassword,
          notes,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Update localStorage credentials for manager/tenant
      if (selectedRequest.user_role === 'manager') {
        const credentials = JSON.parse(localStorage.getItem('managerCredentials') || '[]');
        const updated = credentials.map((cred: any) => 
          cred.email === selectedRequest.email ? { ...cred, password: newPassword } : cred
        );
        localStorage.setItem('managerCredentials', JSON.stringify(updated));
      } else if (selectedRequest.user_role === 'tenant') {
        const credentials = JSON.parse(localStorage.getItem('tenantCredentials') || '[]');
        const updated = credentials.map((cred: any) => 
          cred.email === selectedRequest.email ? { ...cred, password: newPassword } : cred
        );
        localStorage.setItem('tenantCredentials', JSON.stringify(updated));
      }

      toast({
        title: "Password Reset Complete",
        description: `New password has been set for ${selectedRequest.email}. Make sure to share it with them.`,
      });

      setSelectedRequest(null);
      setNewPassword("");
      setNotes("");
      fetchRequests();
    } catch (error) {
      console.error('Error approving password reset:', error);
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "Password reset request has been rejected.",
      });

      fetchRequests();
    } catch (error) {
      console.error('Error rejecting password reset:', error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Password copied to clipboard.",
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Password Reset Requests</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Pending Requests</h3>
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-orange-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {request.email}
                        </CardTitle>
                        <CardDescription>
                          Role: <Badge variant="outline">{request.user_role}</Badge>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested: {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </CardHeader>

                  {selectedRequest?.id === request.id ? (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter or generate password"
                          />
                          <Button type="button" onClick={generatePassword} variant="outline">
                            Generate
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any notes..."
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleApprove} disabled={isProcessing || !newPassword} className="flex-1">
                          <Check className="mr-2 h-4 w-4" />
                          Approve & Reset
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedRequest(null);
                            setNewPassword("");
                            setNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="flex gap-2">
                      <Button onClick={() => setSelectedRequest(request)} className="flex-1">
                        Reset Password
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleReject(request.id)}
                        disabled={isProcessing}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Completed Requests */}
          {completedRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Completed Requests</h3>
              {completedRequests.map((request) => (
                <Card key={request.id} className="opacity-70">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {request.email}
                        </CardTitle>
                        <CardDescription>
                          Role: <Badge variant="outline">{request.user_role}</Badge>
                        </CardDescription>
                      </div>
                      <Badge variant={request.status === 'completed' ? 'default' : 'destructive'}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed: {request.completed_at && format(new Date(request.completed_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </CardHeader>
                  {request.status === 'completed' && request.new_password && (
                    <CardContent>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <div className="flex gap-2">
                          <Input value={request.new_password} readOnly />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(request.new_password!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {request.notes && (
                          <div className="mt-2">
                            <Label>Notes</Label>
                            <p className="text-sm text-muted-foreground">{request.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No password reset requests
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PasswordResetRequestsSheet;
