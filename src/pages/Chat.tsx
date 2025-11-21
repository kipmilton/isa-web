
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/auth/AuthDialog";
import { Send, Plus, History, Menu, Home, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ConversationService, ChatConversation, ChatMessage } from "@/services/conversationService";
import EnhancedShareButton from "@/components/sharing/EnhancedShareButton";
import { toast } from "sonner";
import { ChatService } from "@/services/chatService";

interface Message {
  id: number;
  type: 'user' | 'isa';
  content: string;
  timestamp: Date;
  products?: Array<{
    product_id: string;
    name: string;
    price: number;
    image_url: string;
    main_category: string;
    sub_category: string;
    sub_sub_category: string;
    brand?: string;
    attributes?: any;
  }>;
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

    // Clear input immediately for better UX
    const messageToSend = currentMessage;
    setCurrentMessage("");

    // Show typing indicator
    const typingMessage: Message = {
      id: Date.now() + 1,
      type: 'isa',
      content: '...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // ⭐ CALL ACTUAL GEMINI API BACKEND ⭐
      const response = await ChatService.sendMessage(user.id, messageToSend);

      // Remove typing indicator and add real response
      setMessages(prev => prev.filter(m => m.id !== typingMessage.id));

      const isaResponse: Message = {
        id: Date.now() + 2,
        type: 'isa',
        content: response.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, isaResponse]);

      // Save MyPlug AI response to database
      if (conversationId && response.success) {
        try {
          await ConversationService.addMessage(conversationId, user.id, 'myplug', response.message);
        } catch (error) {
          console.error('Error saving MyPlug AI message:', error);
        }
      }

      // Handle products if returned
      if (response.hasProducts && response.products && response.products.length > 0) {
        const productsMessage: Message = {
          id: Date.now() + 3,
          type: 'isa',
          content: `I found ${response.products.length} products for you!`,
          timestamp: new Date(),
          products: response.products
        };
        
        setMessages(prev => [...prev, productsMessage]);
      }

    } catch (error) {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingMessage.id));
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now() + 4,
        type: 'isa',
        content: "I'm having trouble right now. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response from MyPlug');
    }
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
    return <div className="min-h-screen flex items-center justify-center text-xl">Plugging...</div>;
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
      <div className="min-h-screen flex w-full bg-gray-50 overflow-hidden">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="p-3 md:p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <img src="/MyPlug.png" alt="MyPlug Logo" className="h-5 w-5 md:h-6 md:w-6" />
              <span className="font-semibold text-gray-800 text-sm md:text-base">MyPlug Chat</span>
            </div>
            <Button 
              onClick={startNewChat}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm"
              size="sm"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              New Chat
            </Button>
          </SidebarHeader>
          
          <SidebarContent>
            <div className="p-3 md:p-4">
              <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 mb-3">
                <History className="h-3 w-3 md:h-4 md:w-4" />
                <span>Recent Chats</span>
              </div>
              
              <SidebarMenu>
                {isLoadingConversations ? (
                  <div className="text-center py-4 text-gray-500 text-xs md:text-sm">Loading conversations...</div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-xs md:text-sm">No conversations yet</div>
                ) : (
                  chatHistory.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <div className="flex items-center w-full gap-1">
                        <div 
                          className="flex-1 p-2 md:p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                          onClick={() => selectConversation(chat.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs md:text-sm text-gray-800 truncate">
                              {chat.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-1">
                              {chat.preview}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTime(new Date(chat.updated_at))}
                            </div>
                          </div>
                        </div>
                        {currentConversationId === chat.id && (
                          <div className="flex-shrink-0">
                            <EnhancedShareButton
                              contentType="conversation"
                              contentId={chat.id}
                              contentTitle={chat.title}
                              contentData={chat}
                              variant="ghost"
                              size="sm"
                              showText={false}
                            />
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 overflow-hidden">
          <div className="flex flex-col h-screen max-w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <SidebarTrigger />
                <div className="flex items-center space-x-2 min-w-0">
                  <img src="/MyPlug.png" alt="MyPlug Logo" className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <h1 className="text-lg md:text-xl font-semibold text-gray-800 truncate">Ask MyPlug</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                <div className="text-xs md:text-sm text-gray-500 hidden md:block">
                  Your Shopping Assistant
                </div>
                {currentConversationId && (
                  <EnhancedShareButton
                    contentType="conversation"
                    contentId={currentConversationId}
                    contentTitle={chatHistory.find(c => c.id === currentConversationId)?.title || 'MyPlug Conversation'}
                    contentData={chatHistory.find(c => c.id === currentConversationId)}
                    variant="outline"
                    size="sm"
                    showText={false}
                    className="flex"
                  />
                )}
                <Link to="/">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-2 md:px-4 py-2 hover:scale-105 transition-transform flex items-center">
                    <Home className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Back Home</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-3 md:p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <img src="/MyPlug.png" alt="MyPlug Logo" className="h-12 w-12 md:h-16 md:w-16 mb-4" />
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
                    Hi! I'm MyPlug 👋
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md">
                  Tell me what you want - I'll ask about your budget and preferences - I'll instantly display the best products curated just for you - you can then proceed to checkout.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto px-2 md:px-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-orange-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        {message.type === 'isa' && (
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <img src="/MyPlug.png" alt="MyPlug Logo" className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="text-xs font-medium text-orange-600">MyPlug</span>
                            </div>
                            {currentConversationId && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                                <EnhancedShareButton
                                  contentType="conversation"
                                  contentId={currentConversationId}
                                  contentTitle={chatHistory.find(c => c.id === currentConversationId)?.title || 'MyPlug Conversation'}
                                  contentData={chatHistory.find(c => c.id === currentConversationId)}
                                  variant="ghost"
                                  size="sm"
                                  showText={false}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs md:text-sm leading-relaxed break-words">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1 md:mt-2">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {/* Product Cards Display */}
                        {message.products && message.products.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.products.map((product) => (
                              <div 
                                key={product.product_id} 
                                className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/product/${product.product_id}`)}
                              >
                                <div className="flex gap-3">
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      {product.brand && `${product.brand} • `}
                                      {product.sub_sub_category}
                                    </p>
                                    <p className="text-base font-bold text-orange-600 mt-1">
                                      KES {product.price.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.success('Added to cart!');
                                    }}
                                  >
                                    🛒 Add to Cart
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.success('Added to favorites!');
                                    }}
                                  >
                                    ❤️ Like
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-gray-200 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-2 md:space-x-3">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask MyPlug about products..."
                    className="flex-1 rounded-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 text-sm md:text-base"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim()}
                    className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-3 md:px-4 flex-shrink-0"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center hidden md:block">
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
