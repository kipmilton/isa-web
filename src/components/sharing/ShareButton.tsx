import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, MessageSquare, Heart, ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import { SharedContentService } from '@/services/sharedContentService';
import { useAuth } from '@/hooks/useAuth';

interface ShareButtonProps {
  contentType: 'product' | 'wishlist' | 'cart' | 'conversation';
  contentId: string;
  contentTitle?: string;
  contentImage?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  contentType,
  contentId,
  contentTitle,
  contentImage,
  className = '',
  variant = 'outline',
  size = 'sm',
  showText = true
}) => {
  const { user } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const getContentIcon = () => {
    // Always use the standard share icon for better user understanding
    return <Share2 className="h-4 w-4" />;
  };

  const getContentLabel = () => {
    switch (contentType) {
      case 'product':
        return 'Share Product';
      case 'wishlist':
        return 'Share Wishlist';
      case 'cart':
        return 'Share Cart';
      case 'conversation':
        return 'Share Conversation';
      default:
        return 'Share';
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast.error('Please sign in to share content');
      return;
    }

    setIsSharing(true);
    try {
      let result;
      
      switch (contentType) {
        case 'product':
          result = await SharedContentService.shareProduct(user.id, contentId);
          break;
        case 'wishlist':
          result = await SharedContentService.shareWishlist(user.id);
          break;
        case 'cart':
          result = await SharedContentService.shareCart(user.id);
          break;
        case 'conversation':
          result = await SharedContentService.shareConversation(user.id, contentId);
          break;
        default:
          throw new Error('Invalid content type');
      }

      setShareUrl(result.share_url);
      setShowShareDialog(true);
      toast.success('Share link created successfully!');
    } catch (error) {
      console.error('Error creating share:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(contentTitle || 'Check this out on MyPlug');
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={isSharing}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        {getContentIcon()}
        {showText && getContentLabel()}
        {isSharing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />}
      </Button>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share {getContentLabel()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Content Preview */}
            {contentImage && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={contentImage} 
                  alt={contentTitle} 
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {contentTitle}
                  </p>
                  <p className="text-xs text-gray-500">
                    Shared via MyPlug
                  </p>
                </div>
              </div>
            )}

            {/* Share Link */}
            <div className="space-y-2">
              <Label htmlFor="share-url">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSocialShare('facebook')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Facebook
                </Button>
                <Button
                  onClick={() => handleSocialShare('twitter')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Twitter
                </Button>
                <Button
                  onClick={() => handleSocialShare('whatsapp')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowShareDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton;
