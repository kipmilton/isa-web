export interface ShareMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'product' | 'cart' | 'wishlist' | 'conversation';
}

export class SocialShareService {
  private static readonly BASE_URL = 'https://isa-web.vercel.app';
  private static readonly DEFAULT_IMAGE = '/myplug-logo.png';
  private static readonly DEFAULT_TITLE = 'MyPlug - Shop Smarter, Buy Better';
  private static readonly DEFAULT_DESCRIPTION = 'Smart Shopping Assistant — Explore, Shop, Deliver. Enjoy a seamless online shopping experience, two clicks away.';

  static generateUTMParameters(medium: string = 'social', source: string = 'share'): string {
    return `?utm_source=${source}&utm_medium=${medium}&utm_campaign=share`;
  }

  static generateProductMetadata(product: any, shareUrl: string): ShareMetadata {
    const utmUrl = shareUrl + this.generateUTMParameters('social', 'product_share');
    
    return {
      title: `${product.name} - MyPlug`,
      description: product.description 
        ? `${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}`
        : `Check out this amazing ${product.category} product on MyPlug!`,
      image: product.main_image ? this.getAbsoluteImageUrl(product.main_image) : this.getAbsoluteImageUrl(this.DEFAULT_IMAGE),
      url: utmUrl,
      type: 'product'
    };
  }

  static generateCartMetadata(cartItems: any[], shareUrl: string): ShareMetadata {
    const utmUrl = shareUrl + this.generateUTMParameters('social', 'cart_share');
    const itemCount = cartItems.length;
    const firstItem = cartItems[0];
    
    return {
      title: `🛒 Check out my cart on MyPlug!`,
      description: itemCount === 1 
        ? `I found this amazing ${firstItem?.product?.name} on MyPlug!`
        : `I have ${itemCount} amazing items in my cart on MyPlug!`,
      image: firstItem?.product?.main_image ? this.getAbsoluteImageUrl(firstItem.product.main_image) : this.getAbsoluteImageUrl(this.DEFAULT_IMAGE),
      url: utmUrl,
      type: 'cart'
    };
  }

  static generateWishlistMetadata(wishlistItems: any[], shareUrl: string): ShareMetadata {
    const utmUrl = shareUrl + this.generateUTMParameters('social', 'wishlist_share');
    const itemCount = wishlistItems.length;
    const firstItem = wishlistItems[0];
    
    return {
      title: `❤️ Check out my wishlist on MyPlug!`,
      description: itemCount === 1 
        ? `I'm loving this ${firstItem?.product?.name} on MyPlug!`
        : `I have ${itemCount} amazing items in my wishlist on MyPlug!`,
      image: firstItem?.product?.main_image ? this.getAbsoluteImageUrl(firstItem.product.main_image) : this.getAbsoluteImageUrl(this.DEFAULT_IMAGE),
      url: utmUrl,
      type: 'wishlist'
    };
  }

  static generateConversationMetadata(conversation: any, shareUrl: string): ShareMetadata {
    const utmUrl = shareUrl + this.generateUTMParameters('social', 'conversation_share');
    
    return {
      title: `Chat with MyPlug's smart AI shopper!`,
      description: `Check out this interesting conversation about ${conversation.title || 'shopping'} on MyPlug!`,
      image: this.getAbsoluteImageUrl(this.DEFAULT_IMAGE),
      url: utmUrl,
      type: 'conversation'
    };
  }

  static generateSocialShareUrls(metadata: ShareMetadata) {
    const encodedUrl = encodeURIComponent(metadata.url);
    const encodedTitle = encodeURIComponent(metadata.title);
    const encodedDescription = encodeURIComponent(metadata.description);
    const encodedImage = encodeURIComponent(metadata.image);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedDescription}`
    };
  }

  static updatePageMetaTags(metadata: ShareMetadata) {
    // Update Open Graph tags
    this.updateMetaTag('og:title', metadata.title);
    this.updateMetaTag('og:description', metadata.description);
    this.updateMetaTag('og:image', metadata.image);
    this.updateMetaTag('og:url', metadata.url);
    this.updateMetaTag('og:type', 'website');

    // Update Twitter Card tags
    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:title', metadata.title);
    this.updateMetaTag('twitter:description', metadata.description);
    this.updateMetaTag('twitter:image', metadata.image);
    this.updateMetaTag('twitter:url', metadata.url);

    // Update page title
    document.title = metadata.title;

    // Update meta description
    this.updateMetaTag('description', metadata.description);
  }

  private static updateMetaTag(property: string, content: string) {
    // Update existing meta tag or create new one
    let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`);
    
    if (metaTag) {
      metaTag.setAttribute('content', content);
    } else {
      metaTag = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        metaTag.setAttribute('property', property);
      } else {
        metaTag.setAttribute('name', property);
      }
      metaTag.setAttribute('content', content);
      document.head.appendChild(metaTag);
    }
  }

  static resetToDefaultMetaTags() {
    this.updatePageMetaTags({
      title: this.DEFAULT_TITLE,
      description: this.DEFAULT_DESCRIPTION,
      image: this.DEFAULT_IMAGE,
      url: this.BASE_URL,
      type: 'product'
    });
  }

  private static getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) return `${this.BASE_URL}${this.DEFAULT_IMAGE}`;
    
    // If it's already an absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative URL, make it absolute
    if (imageUrl.startsWith('/')) {
      return `${this.BASE_URL}${imageUrl}`;
    }
    
    // If it's a relative URL without leading slash, add it
    return `${this.BASE_URL}/${imageUrl}`;
  }
}
