# Enhanced Share Feature

This document describes the comprehensive share feature implementation that provides attractive social media previews and UTM tracking for MyPlug.

## Features

### 1. Dynamic Meta Tags
- **Open Graph** tags for Facebook, LinkedIn, and other platforms
- **Twitter Card** tags for Twitter sharing
- **Dynamic updates** based on content type (product, cart, wishlist, conversation)
- **Automatic fallbacks** to default MyPlug branding

### 2. Content-Specific Sharing

#### Product Pages
- Shows product name, first image, price, and short description
- UTM parameters: `?utm_source=product_share&utm_medium=social&utm_campaign=share`
- Example: "Amazing iPhone 15 Pro - MyPlug"

#### Cart Sharing
- Shows first product image or MyPlug logo if empty
- Promotional message: "🛒 Check out my cart on MyPlug!"
- UTM parameters: `?utm_source=cart_share&utm_medium=social&utm_campaign=share`

#### Wishlist Sharing
- Shows first product image or MyPlug logo if empty
- Promotional message: "❤️ Check out my wishlist on MyPlug!"
- UTM parameters: `?utm_source=wishlist_share&utm_medium=social&utm_campaign=share`

#### Chat/Conversation Sharing
- Shows MyPlug logo and conversation title
- Message: "Chat with MyPlug's smart AI shopper!"
- UTM parameters: `?utm_source=conversation_share&utm_medium=social&utm_campaign=share`

### 3. Social Media Platforms
- Facebook
- Twitter/X
- WhatsApp
- LinkedIn
- Telegram
- Reddit
- Pinterest

### 4. Visual Features
- **Live preview cards** showing how content will appear on different platforms
- **Platform-specific styling** for preview cards
- **Responsive design** that works on mobile and desktop
- **Error handling** with fallback images

## Implementation

### Components

#### `EnhancedShareButton`
Main share button component with enhanced functionality:
```tsx
<EnhancedShareButton
  contentType="product"
  contentId={product.id}
  contentTitle={product.name}
  contentImage={product.main_image}
  contentData={product}
  variant="outline"
  size="sm"
/>
```

#### `SocialPreviewCard`
Shows how content will appear on different social platforms:
```tsx
<SocialPreviewCard 
  metadata={shareMetadata} 
  platform="facebook" 
/>
```

### Services

#### `SocialShareService`
Handles metadata generation and meta tag updates:
- `generateProductMetadata()`
- `generateCartMetadata()`
- `generateWishlistMetadata()`
- `generateConversationMetadata()`
- `updatePageMetaTags()`

#### `usePageMeta` Hook
React hook for managing page meta tags:
```tsx
const shareMetadata = SocialShareService.generateProductMetadata(product, url);
usePageMeta(shareMetadata);
```

### Utilities

#### `shareUtils.ts`
Helper functions for URL generation and analytics:
- `generateShareUrl()`
- `trackShareEvent()`

## Usage Examples

### Product Page
```tsx
// Automatically updates meta tags when product loads
const shareMetadata = SocialShareService.generateProductMetadata(product, window.location.href);
usePageMeta(shareMetadata);

// Share button with product data
<EnhancedShareButton
  contentType="product"
  contentId={product.id}
  contentData={product}
/>
```

### Cart Modal
```tsx
<EnhancedShareButton
  contentType="cart"
  contentId={user.id}
  contentData={cartItems}
/>
```

### Chat Page
```tsx
<EnhancedShareButton
  contentType="conversation"
  contentId={conversationId}
  contentData={conversation}
/>
```

## UTM Tracking

All shared links include UTM parameters for analytics:
- `utm_source`: Content type (product_share, cart_share, etc.)
- `utm_medium`: Always "social"
- `utm_campaign`: Always "share"

## Social Media Optimization

### Image Requirements
- **Minimum size**: 1200x630px for optimal display
- **Aspect ratio**: 1.91:1 for Facebook/LinkedIn
- **Format**: JPG or PNG
- **File size**: Under 5MB

### Title Optimization
- **Length**: 60 characters or less for Twitter
- **Include**: Product name and MyPlug branding
- **Emojis**: Used strategically for cart and wishlist

### Description Optimization
- **Length**: 150 characters or less
- **Include**: Key product details or promotional message
- **Call to action**: Encourages clicks

## Testing

### Social Media Debuggers
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

### Preview Testing
The share dialog includes live previews showing exactly how content will appear on different platforms.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Meta tags are updated dynamically without page reload
- Images are optimized for social media platforms
- UTM parameters are minimal to keep URLs clean
- Fallback images prevent broken previews

## Analytics Integration

The system includes hooks for analytics tracking:
```tsx
trackShareEvent('product', productId, 'facebook');
```

This can be integrated with Google Analytics, Mixpanel, or other analytics platforms.
