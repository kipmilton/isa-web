
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/auth/AuthDialog";
import { Send, Plus, History, Menu, Home, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationService, ChatConversation, ChatMessage } from "@/services/conversationService";
import EnhancedShareButton from "@/components/sharing/EnhancedShareButton";
import { toast } from "sonner";

  interface Message {
  id: number;
  type: 'user' | 'isa';
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: Date;
  preview: string;
}

const Chat = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Load conversations when user is available
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Check for rejected vendors on page load
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type, status')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.user_type === 'vendor' && profile.status === 'rejected') {
            navigate('/vendor-rejection');
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [navigate]);

  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoadingConversations(true);
    try {
      const conversations = await ConversationService.getUserConversations(user.id);
      setChatHistory(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const dbMessages = await ConversationService.getConversationMessages(conversationId);
      const formattedMessages: Message[] = dbMessages.map(msg => ({
        id: parseInt(msg.id.replace(/-/g, '').substring(0, 8), 16),
        type: msg.role === 'myplug' ? 'isa' : 'user',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user) return;

    const newUserMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    // Create conversation if it doesn't exist
    let conversationId = currentConversationId;
    if (!conversationId) {
      try {
        const title = ConversationService.generateConversationTitle(currentMessage);
        const conversation = await ConversationService.createConversation(user.id, title, currentMessage);
        conversationId = conversation.id;
        setCurrentConversationId(conversationId);
        
        // Add to chat history
        setChatHistory(prev => [conversation, ...prev]);
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to save conversation');
      }
    }

    // Save user message to database
    if (conversationId) {
      try {
        await ConversationService.addMessage(conversationId, user.id, 'user', currentMessage);
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Simulate ISA response
    setTimeout(async () => {
      const responses = [
        "I'd be happy to help you find the perfect products! Let me search through our curated selection...",
        "Great question! Based on your preferences, I can recommend several options that match your style and budget.",
        "I've found some amazing deals that I think you'll love! Here are my top recommendations...",
        "Let me help you discover products that are trending and perfect for your needs...",
        "I can definitely assist with that! I've curated some fantastic options just for you..."
      ];
      
      const isaResponse: Message = {
        id: Date.now() + 1,
        type: 'isa',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, isaResponse]);

      // Save ISA response to database
      if (conversationId) {
        try {
          await ConversationService.addMessage(conversationId, user.id, 'myplug', isaResponse.content);
        } catch (error) {
          console.error('Error saving ISA message:', error);
        }
      }
    }, 1500);

    setCurrentMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const selectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    await loadConversationMessages(conversationId);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-xl gap-6">
        <div>You must be signed in to use Ask MyPlug.</div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg shadow-lg"
          onClick={() => setShowAuth(true)}
        >
          Sign In
        </Button>
        <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <img src="/MyPlug.png" alt="MyPlug Logo" className="h-6 w-6" />
              <span className="font-semibold text-gray-800">MyPlug Chat</span>
            </div>
            <Button 
              onClick={startNewChat}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </SidebarHeader>
          
          <SidebarContent>
            <div className="p-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <History className="h-4 w-4" />
                <span>Recent Chats</span>
              </div>
              
              <SidebarMenu>
                {isLoadingConversations ? (
                  <div className="text-center py-4 text-gray-500">Loading conversations...</div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No conversations yet</div>
                ) : (
                  chatHistory.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton 
                        className="w-full text-left p-3 hover:bg-gray-100 rounded-lg"
                        onClick={() => selectConversation(chat.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {chat.preview}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatTime(new Date(chat.updated_at))}
                          </div>
                        </div>
                        {currentConversationId === chat.id && (
                          <EnhancedShareButton
                            contentType="conversation"
                            contentId={chat.id}
                            contentTitle={chat.title}
                            contentData={chat}
                            variant="ghost"
                            size="sm"
                            showText={false}
                            className="ml-2"
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <SidebarTrigger />
                <div className="flex items-center space-x-2">
                  <img src="/MyPlug.png" alt="MyPlug Logo" className="h-6 w-6" />
                  <h1 className="text-xl font-semibold text-gray-800">Ask MyPlug</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Your AI Shopping Assistant
                </div>
                {currentConversationId && (
                  <EnhancedShareButton
                    contentType="conversation"
                    contentId={currentConversationId}
                    contentTitle={chatHistory.find(c => c.id === currentConversationId)?.title || 'MyPlug Conversation'}
                    contentData={chatHistory.find(c => c.id === currentConversationId)}
                    variant="outline"
                    size="sm"
                  />
                )}
                <Link to="/">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 hover:scale-105 transition-transform flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Back Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <img src="/MyPlug.png" alt="MyPlug Logo" className="h-16 w-16 mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Hi! I'm MyPlug 👋
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Your AI Shopping Assistant is here to help you discover amazing products, 
                    compare prices, and find exactly what you're looking for!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-200 cursor-pointer transition-colors">
                      <h3 className="font-medium text-gray-800 mb-2">🛍️ Find Products</h3>
                      <p className="text-sm text-gray-600">Search for items across multiple stores and platforms</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-200 cursor-pointer transition-colors">
                      <h3 className="font-medium text-gray-800 mb-2">💰 Compare Prices</h3>
                      <p className="text-sm text-gray-600">Get the best deals and price comparisons</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-200 cursor-pointer transition-colors">
                      <h3 className="font-medium text-gray-800 mb-2">✨ Get Recommendations</h3>
                      <p className="text-sm text-gray-600">Personalized suggestions based on your preferences</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-200 cursor-pointer transition-colors">
                      <h3 className="font-medium text-gray-800 mb-2">🎁 Suggest gifts for loved one</h3>
                      <p className="text-sm text-gray-600">Get thoughtful gift ideas for special occasions</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-orange-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        {message.type === 'isa' && (
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <img src="/MyPlug.png" alt="MyPlug Logo" className="h-4 w-4" />
                              <span className="text-xs font-medium text-orange-600">MyPlug</span>
                            </div>
                            {currentConversationId && (
                              <EnhancedShareButton
                                contentType="conversation"
                                contentId={currentConversationId}
                                contentTitle={chatHistory.find(c => c.id === currentConversationId)?.title || 'MyPlug Conversation'}
                                contentData={chatHistory.find(c => c.id === currentConversationId)}
                                variant="ghost"
                                size="sm"
                                showText={false}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            )}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-3">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask MyPlug about products, prices, recommendations..."
                    className="flex-1 rounded-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim()}
                    className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  MyPlug can make mistakes. Please verify important information.
                </p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Chat;
