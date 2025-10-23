import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Image, AlertTriangle, Shield, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ChatModerationService } from '@/services/chatModerationService';

interface Message {
  id: string;
  sender_type: 'customer' | 'vendor';
  message_text?: string;
  image_url?: string;
  created_at: string;
  is_read: boolean;
}

interface OrderMessagingProps {
  orderId: string;
  userType: 'customer' | 'vendor';
  userId: string;
}

const OrderMessaging = ({ orderId, userType, userId }: OrderMessagingProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    checkUserSuspension();
    const channel = supabase
      .channel(`order_messages:${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_messages',
        filter: `order_id=eq.${orderId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkUserSuspension = async () => {
    try {
      const suspended = await ChatModerationService.isUserSuspended(userId);
      setIsSuspended(suspended);
    } catch (error) {
      console.error('Error checking user suspension status:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() && userType === 'customer') {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    // Check if user is suspended
    if (isSuspended) {
      toast({
        title: "Account Suspended",
        description: "Your account has been suspended due to policy violations. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    // Moderate the message
    const moderationResult = ChatModerationService.moderateMessage(messageText);
    
    // Log the moderation result
    await ChatModerationService.logModeratedMessage(userId, orderId, moderationResult);

    // If message is blocked, show warning and don't send
    if (moderationResult.isBlocked) {
      setModerationWarning(moderationResult.warningMessage || 'Message contains restricted content');
      
      // Record violations for each violation type
      for (const violation of moderationResult.violations) {
        await ChatModerationService.recordViolation(userId, violation);
      }

      toast({
        title: "Message Blocked",
        description: moderationResult.warningMessage || 'Message contains restricted content',
        variant: "destructive"
      });
      return;
    }

    try {
      const messageToSend = moderationResult.isMasked ? moderationResult.moderatedMessage : messageText;
      
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: orderId,
          sender_id: userId,
          sender_type: userType,
          message_text: messageToSend
        });

      if (error) throw error;

      setMessageText('');
      setModerationWarning(null);
      
      // Show different messages based on moderation result
      if (moderationResult.isMasked) {
        toast({
          title: "Message sent",
          description: "Your message was sent with sensitive information masked for security"
        });
      } else {
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Only image files are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `order-messages/${orderId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('order_messages')
        .insert({
          order_id: orderId,
          sender_id: userId,
          sender_type: userType,
          image_url: publicUrl,
          message_text: userType === 'vendor' ? null : undefined
        });

      if (insertError) throw insertError;

      toast({
        title: "Image sent",
        description: "Your image has been sent successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Order Messages
        </CardTitle>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Do not share personal contact information (phone, email, social media)</span>
          </div>
          {userType === 'vendor' && (
            <div className="text-orange-600">Vendors can only send images, no text messages</div>
          )}
          {isSuspended && (
            <div className="flex items-center gap-1 text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>Your account is suspended due to policy violations. Please contact support.</span>
            </div>
          )}
          {moderationWarning && (
            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>{moderationWarning}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Messages */}
          <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">No messages yet. Start a conversation!</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === userType ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                      msg.sender_type === userType
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border'
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-70">
                      {msg.sender_type === 'customer' ? 'Customer' : 'Vendor'}
                    </div>
                    {msg.message_text && <p className="text-sm">{msg.message_text}</p>}
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Message attachment"
                        className="max-w-full rounded mt-2"
                      />
                    )}
                    <div className="text-xs mt-1 opacity-70">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            {userType === 'customer' && (
              <>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isSuspended ? "Account suspended - contact support" : "Type your message..."}
                  onKeyPress={(e) => e.key === 'Enter' && !isSuspended && sendMessage()}
                  disabled={isSuspended}
                />
                <Button onClick={sendMessage} disabled={isSuspended}>
                  <Send className="w-4 h-4" />
                </Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isSuspended}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || isSuspended}
            >
              <Image className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Image'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderMessaging;
