import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SocialShareService } from '@/services/socialShareService';
import { usePageMeta } from '@/hooks/usePageMeta';

// Mock data for testing
const mockProduct = {
  id: 'test-product-1',
  name: 'iPhone 15 Pro Max',
  description: 'The most advanced iPhone with titanium design and A17 Pro chip. Features include 48MP camera system, Action Button, and USB-C connectivity.',
  price: 119999,
  category: 'Electronics',
  main_image: '/myplug-logo.png'
};

const mockCartItems = [
  {
    id: 'cart-item-1',
    product: {
      name: 'iPhone 15 Pro',
      main_image: '/myplug-logo.png'
    }
  },
  {
    id: 'cart-item-2',
    product: {
      name: 'AirPods Pro',
      main_image: '/myplug-logo.png'
    }
  }
];

const mockWishlistItems = [
  {
    id: 'wishlist-item-1',
    product: {
      name: 'MacBook Pro M3',
      main_image: '/myplug-logo.png'
    }
  }
];

const mockConversation = {
  id: 'conv-1',
  title: 'Best laptops for students',
  preview: 'Looking for recommendations for student laptops under 100k'
};

export const ShareFeatureTest: React.FC = () => {
  const [testType, setTestType] = useState<'product' | 'cart' | 'wishlist' | 'conversation'>('product');
  const [shareMetadata, setShareMetadata] = useState<any>(null);

  const generateTestMetadata = () => {
    const baseUrl = 'https://isa-web.vercel.app';
    let metadata;

    switch (testType) {
      case 'product':
        metadata = SocialShareService.generateProductMetadata(mockProduct, baseUrl);
        break;
      case 'cart':
        metadata = SocialShareService.generateCartMetadata(mockCartItems, baseUrl);
        break;
      case 'wishlist':
        metadata = SocialShareService.generateWishlistMetadata(mockWishlistItems, baseUrl);
        break;
      case 'conversation':
        metadata = SocialShareService.generateConversationMetadata(mockConversation, baseUrl);
        break;
    }

    setShareMetadata(metadata);
  };

  // Update page meta tags when metadata changes
  usePageMeta(shareMetadata);

  const testSocialShare = (platform: string) => {
    if (!shareMetadata) return;
    
    const socialUrls = SocialShareService.generateSocialShareUrls(shareMetadata);
    const url = socialUrls[platform as keyof typeof socialUrls];
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Share Feature Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => setTestType('product')}
              variant={testType === 'product' ? 'default' : 'outline'}
            >
              Product
            </Button>
            <Button 
              onClick={() => setTestType('cart')}
              variant={testType === 'cart' ? 'default' : 'outline'}
            >
              Cart
            </Button>
            <Button 
              onClick={() => setTestType('wishlist')}
              variant={testType === 'wishlist' ? 'default' : 'outline'}
            >
              Wishlist
            </Button>
            <Button 
              onClick={() => setTestType('conversation')}
              variant={testType === 'conversation' ? 'default' : 'outline'}
            >
              Conversation
            </Button>
          </div>

          <Button onClick={generateTestMetadata}>
            Generate {testType} metadata
          </Button>

          {shareMetadata && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <strong>Title:</strong> {shareMetadata.title}
                    </div>
                    <div>
                      <strong>Description:</strong> {shareMetadata.description}
                    </div>
                    <div>
                      <strong>Image:</strong> {shareMetadata.image}
                    </div>
                    <div>
                      <strong>URL:</strong> {shareMetadata.url}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Social Share URLs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {['facebook', 'twitter', 'whatsapp', 'linkedin', 'telegram', 'reddit', 'pinterest'].map(platform => (
                      <Button
                        key={platform}
                        onClick={() => testSocialShare(platform)}
                        variant="outline"
                        size="sm"
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meta Tags Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 p-4 rounded text-sm font-mono">
                    <div>&lt;meta property="og:title" content="{shareMetadata.title}" /&gt;</div>
                    <div>&lt;meta property="og:description" content="{shareMetadata.description}" /&gt;</div>
                    <div>&lt;meta property="og:image" content="{shareMetadata.image}" /&gt;</div>
                    <div>&lt;meta property="og:url" content="{shareMetadata.url}" /&gt;</div>
                    <div>&lt;meta name="twitter:card" content="summary_large_image" /&gt;</div>
                    <div>&lt;meta name="twitter:title" content="{shareMetadata.title}" /&gt;</div>
                    <div>&lt;meta name="twitter:description" content="{shareMetadata.description}" /&gt;</div>
                    <div>&lt;meta name="twitter:image" content="{shareMetadata.image}" /&gt;</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareFeatureTest;
