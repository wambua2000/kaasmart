import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { streamChat, getRoleTitle } from '@/lib/chatUtils';
import { useToast } from '@/hooks/use-toast';
import kaasmartLogo from '@/assets/kaasmart-logo.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RoleChatbotProps {
  role: 'owner' | 'manager' | 'tenant';
  userId: string;
  userName?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export function RoleChatbot({ role, userId, userName, position = 'bottom-right' }: RoleChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const roleColors = {
    owner: 'bg-primary hover:bg-primary/90',
    manager: 'bg-green-600 hover:bg-green-700',
    tenant: 'bg-purple-600 hover:bg-purple-700',
  };

  const roleIconBg = {
    owner: 'bg-primary/10 text-primary',
    manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    tenant: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await streamChat({
        role,
        userId,
        messages: [...messages, userMessage],
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (error) => {
          setIsLoading(false);
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive',
          });
        },
      });
    } catch (err) {
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 bottom-4' 
    : 'left-4 bottom-4';

  return (
    <div className={`fixed ${positionClasses} z-50 flex flex-col items-center gap-2`}>
      {!isOpen && (
        <>
          <div className={`${roleColors[role]} text-white px-4 py-2 rounded-lg shadow-md text-sm font-medium whitespace-nowrap`}>
            How can I help you?
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className={`${roleColors[role]} rounded-full h-14 w-14 shadow-lg`}
            size="icon"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </>
      )}

      {isOpen && (
        <Card className="w-[380px] h-[600px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className={`${roleColors[role]} text-white px-4 py-3 flex items-center justify-between rounded-t-lg`}>
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                <img src={kaasmartLogo} alt="Kaasmart" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{getRoleTitle(role)}</h3>
                {userName && <p className="text-xs opacity-90">{userName}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">👋 Hi! How can I help you today?</p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className={`${roleIconBg[role]} rounded-full h-8 w-8 flex items-center justify-center mr-2 flex-shrink-0 p-1`}>
                      <img src={kaasmartLogo} alt="Kaasmart" className="h-5 w-5 object-contain" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? `${roleColors[role]} text-white`
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`${roleIconBg[role]} rounded-full h-8 w-8 flex items-center justify-center mr-2 p-1`}>
                    <img src={kaasmartLogo} alt="Kaasmart" className="h-5 w-5 object-contain" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Typing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={roleColors[role]}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
