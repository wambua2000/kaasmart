import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  tenant_id: string;
}

interface MessageViewerProps {
  roomId: string;
  userRole: "owner" | "manager";
}

const MessageViewer = ({ roomId, userRole }: MessageViewerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchMessages();
    }
  }, [roomId]);

  if (loading) {
    return <div className="text-center py-4">Loading messages...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Property Owner Messages
          {userRole === "manager" && (
            <Badge variant="secondary" className="text-xs">
              View Only
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No messages found for this room.
          </p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Property Owner</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(message.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageViewer;