import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Share2, Heart, ShoppingCart, MessageSquare, Package, ExternalLink } from 'lucide-react';
import { SharedContentService, SharedContent } from '@/services/sharedContentService';
import { ConversationService } from '@/services/conversationService';
import { ProductService } from '@/services/productService';
import { OrderService } from '@/services/orderService';
import { useAuth } from '@/hooks/useAuth';
import AuthDialog from '@/components/auth/AuthDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SharedContentPage = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contentData, setContentData] = useState<any>(null);
  const [showAppChoice, setShowAppChoice] = useState(false);

  useEffect(() => {
    if (shareCode) {
      loadSharedContent();
    }
  }, [shareCode]);

  const loadSharedContent = async () => {
    if (!shareCode) return;

    setIsLoading(true);
    try {
      const content = await SharedContentService.getSharedContent(shareCode);
      if (!content) {
        toast.error('Shared content not found or expired');
        navigate('/');
        return;
      }

      setSharedContent(content);
      await loadContentData(content);
    } catch (error) {
      console.error('Error loading shared content:', error);
      toast.error('Failed to load shared content');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentData = async (content: SharedContent) => {
    try {
      switch (content.content_type) {
        case 'product':
          const product = await ProductService.getProductById(content.content_id);
          setContentData(product);
          break;
        case 'conversation':
          const conversation = await ConversationService.getSharedConversation(content.content_id);
          const messages = await ConversationService.getConversationMessages(content.content_id);
          setContentData({ conversation, messages });
          break;
        case 'wishlist':
          const wishlistItems = await OrderService.getWishlistItems(content.content_id);
          setContentData(wishlistItems);
          break;
        case 'cart':
          const cartItems = await OrderService.getCartItems(content.content_id);
          setContentData(cartItems);
          break;
      }
    } catch (error) {
      console.error('Error loading content data:', error);
    }
  };

  const handleSignIn = () => {
    // Store the current URL to redirect back after login
    sessionStorage.setItem('intendedPath', window.location.pathname);
    setShowAuth(true);
  };

  const handleViewInApp = () => {
    if (!user) {
      handleSignIn();
      return;
    }

    if (!sharedContent || !contentData) return;

    switch (sharedContent.content_type) {
      case 'product':
        navigate(`/product/${sharedContent.content_id}`);
        break;
      case 'conversation':
        navigate(`/chat?conversation=${sharedContent.content_id}`);
        break;
      case 'wishlist':
        navigate('/profile?tab=wishlist');
        break;
      case 'cart':
        navigate('/shop');
        break;
    }
  };

  const handleViewOnWebsite = () => {
    if (!user) {
      handleSignIn();
      return;
    }

    handleViewInApp();
  };

  const renderProductContent = () => {
    if (!contentData) return null;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-orange-600" />
            <Badge variant="secondary">Shared Product</Badge>
          </div>
          <CardTitle className="text-2xl">{contentData.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentData.main_image && (
            <img 
              src={contentData.main_image} 
              alt={contentData.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          <div className="space-y-2">
            <p className="text-gray-600">{contentData.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-orange-600">
                KES {contentData.price?.toLocaleString()}
              </span>
              <Badge variant="outline">{contentData.category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderConversationContent = () => {
    if (!contentData?.conversation || !contentData?.messages) return null;

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <Badge variant="secondary">Shared Conversation</Badge>
          </div>
          <CardTitle className="text-xl">{contentData.conversation.title}</CardTitle>
          <p className="text-gray-600">{contentData.conversation.preview}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {contentData.messages.map((message: any) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-orange-100 ml-8'
                    : 'bg-gray-100 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'myplug' && (
                    <img src="/MyPlug.png" alt="MyPlug" className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium text-gray-600">
                    {message.role === 'user' ? 'You' : 'MyPlug'}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWishlistContent = () => {
    if (!contentData) return null;

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-red-600" />
            <Badge variant="secondary">Shared Wishlist</Badge>
          </div>
          <CardTitle className="text-xl">Wishlist Items ({contentData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentData.slice(0, 6).map((item: any) => (
              <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                <img 
                  src={item.product?.main_image || '/placeholder.svg'} 
                  alt={item.product?.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.product?.name}</h4>
                  <p className="text-orange-600 font-bold">
                    KES {item.product?.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {contentData.length > 6 && (
            <p className="text-center text-gray-500 mt-4">
              And {contentData.length - 6} more items...
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCartContent = () => {
    if (!contentData) return null;

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <Badge variant="secondary">Shared Cart</Badge>
          </div>
          <CardTitle className="text-xl">Cart Items ({contentData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contentData.map((item: any) => (
              <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                <img 
                  src={item.product?.main_image || '/placeholder.svg'} 
                  alt={item.product?.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.product?.name}</h4>
                  <p className="text-orange-600 font-bold">
                    KES {item.product?.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (!sharedContent || !contentData) return null;

    switch (sharedContent.content_type) {
      case 'product':
        return renderProductContent();
      case 'conversation':
        return renderConversationContent();
      case 'wishlist':
        return renderWishlistContent();
      case 'cart':
        return renderCartContent();
      default:
        return null;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (!sharedContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h1>
          <p className="text-gray-600 mb-6">This shared content may have expired or been removed.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-orange-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center space-x-3">
              <img src="/MyPlug.png" alt="MyPlug Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-800">MyPlug</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAppChoice(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Shared Content
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Someone shared this content with you via MyPlug. 
            {!user && ' Sign in to view the full content and interact with it.'}
          </p>
        </div>

        {renderContent()}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {!user ? (
            <Button
              onClick={handleSignIn}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
            >
              Sign In to View Full Content
            </Button>
          ) : (
            <>
              <Button
                onClick={handleViewInApp}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
              >
                View in MyPlug
              </Button>
              <Button
                onClick={handleViewOnWebsite}
                variant="outline"
                className="px-8 py-3"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open on Website
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />

      {/* App Choice Dialog */}
      <Dialog open={showAppChoice} onOpenChange={setShowAppChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share This Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose how you'd like to share this content:
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                  setShowAppChoice(false);
                }}
                className="w-full"
              >
                Copy Link
              </Button>
              <Button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const title = encodeURIComponent(sharedContent?.metadata?.product_name || 'Check this out on MyPlug');
                  window.open(`https://wa.me/?text=${title}%20${url}`, '_blank');
                  setShowAppChoice(false);
                }}
                variant="outline"
                className="w-full"
              >
                Share on WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedContentPage;
