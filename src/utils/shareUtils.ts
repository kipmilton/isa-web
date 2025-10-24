import { SocialShareService } from '@/services/socialShareService';

export const generateShareUrl = (baseUrl: string, contentType: string, contentId: string): string => {
  const utmParams = SocialShareService.generateUTMParameters('social', `${contentType}_share`);
  return `${baseUrl}${utmParams}`;
};

export const generateProductShareUrl = (productId: string): string => {
  const baseUrl = `https://isa-web.vercel.app/product/${productId}`;
  return generateShareUrl(baseUrl, 'product', productId);
};

export const generateCartShareUrl = (userId: string): string => {
  const baseUrl = `https://isa-web.vercel.app/shared/cart/${userId}`;
  return generateShareUrl(baseUrl, 'cart', userId);
};

export const generateWishlistShareUrl = (userId: string): string => {
  const baseUrl = `https://isa-web.vercel.app/shared/wishlist/${userId}`;
  return generateShareUrl(baseUrl, 'wishlist', userId);
};

export const generateConversationShareUrl = (conversationId: string): string => {
  const baseUrl = `https://isa-web.vercel.app/shared/chat/${conversationId}`;
  return generateShareUrl(baseUrl, 'conversation', conversationId);
};

export const trackShareEvent = (contentType: string, contentId: string, platform: string) => {
  // Track share events for analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      content_type: contentType,
      item_id: contentId,
      method: platform
    });
  }
  
  // You can also send to your analytics service here
  console.log(`Share tracked: ${contentType} - ${contentId} - ${platform}`);
};
