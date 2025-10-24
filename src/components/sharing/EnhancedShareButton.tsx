import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Heart, 
  ShoppingCart, 
  Package,
  MessageCircle,
  Send,
  Image as PinterestIcon,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { SharedContentService } from '@/services/sharedContentService';
import { SocialShareService, ShareMetadata } from '@/services/socialShareService';
import { useAuth } from '@/hooks/useAuth';
import SocialPreviewCard from './SocialPreviewCard';

interface EnhancedShareButtonProps {
  contentType: 'product' | 'wishlist' | 'cart' | 'conversation';
  contentId: string;
  contentTitle?: string;
  contentImage?: string;
  contentData?: any; // Additional data for generating metadata
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
}

export const EnhancedShareButton: React.FC<EnhancedShareButtonProps> = ({
  contentType,
  contentId,
  contentTitle,
  contentImage,
  contentData,
  className = '',
  variant = 'outline',
  size = 'sm',
  showText = true
}) => {
  const { user } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMetadata, setShareMetadata] = useState<ShareMetadata | null>(null);
  const [copied, setCopied] = useState(false);

  const getContentIcon = () => {
    switch (contentType) {
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'wishlist':
        return <Heart className="h-4 w-4" />;
      case 'cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
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
        return 'Share Chat';
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
      
      // Generate metadata based on content type
      let metadata: ShareMetadata;
      switch (contentType) {
        case 'product':
          metadata = SocialShareService.generateProductMetadata(contentData, result.share_url);
          break;
        case 'wishlist':
          metadata = SocialShareService.generateWishlistMetadata(contentData || [], result.share_url);
          break;
        case 'cart':
          metadata = SocialShareService.generateCartMetadata(contentData || [], result.share_url);
          break;
        case 'conversation':
          metadata = SocialShareService.generateConversationMetadata(contentData, result.share_url);
          break;
        default:
          throw new Error('Invalid content type');
      }
      
      setShareMetadata(metadata);
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

  const handleSocialShare = (platform: string) => {
    if (!shareMetadata) return;
    
    const socialUrls = SocialShareService.generateSocialShareUrls(shareMetadata);
    const url = socialUrls[platform as keyof typeof socialUrls];
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <MessageCircle className="h-4 w-4" />;
      case 'twitter':
        return <MessageCircle className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'linkedin':
        return <ExternalLink className="h-4 w-4" />;
      case 'telegram':
        return <Send className="h-4 w-4" />;
      case 'reddit':
        return <MessageCircle className="h-4 w-4" />;
      case 'pinterest':
        return <PinterestIcon className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'twitter':
        return 'bg-sky-500 hover:bg-sky-600 text-white';
      case 'whatsapp':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'linkedin':
        return 'bg-blue-700 hover:bg-blue-800 text-white';
      case 'telegram':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'reddit':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'pinterest':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const socialPlatforms = [
    { key: 'facebook', name: 'Facebook' },
    { key: 'twitter', name: 'Twitter' },
    { key: 'whatsapp', name: 'WhatsApp' },
    { key: 'linkedin', name: 'LinkedIn' },
    { key: 'telegram', name: 'Telegram' },
    { key: 'reddit', name: 'Reddit' },
    { key: 'pinterest', name: 'Pinterest' }
  ];

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share {getContentLabel()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Social Media Preview */}
            {shareMetadata && (
              <div className="space-y-4">
                <Label>How it will look when shared:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Facebook Preview</p>
                    <SocialPreviewCard metadata={shareMetadata} platform="facebook" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Twitter Preview</p>
                    <SocialPreviewCard metadata={shareMetadata} platform="twitter" />
                  </div>
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
            <div className="space-y-3">
              <Label>Share on Social Media</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {socialPlatforms.map((platform) => (
                  <Button
                    key={platform.key}
                    onClick={() => handleSocialShare(platform.key)}
                    className={`flex items-center gap-2 ${getSocialColor(platform.key)}`}
                    size="sm"
                  >
                    {getSocialIcon(platform.key)}
                    <span className="hidden sm:inline">{platform.name}</span>
                  </Button>
                ))}
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

export default EnhancedShareButton;
