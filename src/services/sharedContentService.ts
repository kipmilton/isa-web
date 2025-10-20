import { supabase } from '@/integrations/supabase/client';

export interface SharedContent {
  id: string;
  user_id: string;
  content_type: 'product' | 'wishlist' | 'cart' | 'conversation';
  content_id: string;
  share_code: string;
  metadata: any;
  view_count: number;
  created_at: string;
  expires_at?: string;
}

export interface ShareResult {
  share_code: string;
  share_url: string;
  expires_at?: string;
}

export class SharedContentService {
  static async createShare(
    userId: string,
    contentType: 'product' | 'wishlist' | 'cart' | 'conversation',
    contentId: string,
    metadata: any = {},
    expiresInHours?: number
  ): Promise<ShareResult> {
    try {
      const expiresAt = expiresInHours 
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('shared_content')
        .insert({
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          metadata,
          expires_at: expiresAt
        })
        .select('share_code, expires_at')
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${data.share_code}`;
      
      return {
        share_code: data.share_code,
        share_url: shareUrl,
        expires_at: data.expires_at
      };
    } catch (error) {
      console.error('Error creating share:', error);
      throw error;
    }
  }

  static async getSharedContent(shareCode: string): Promise<SharedContent | null> {
    try {
      const { data, error } = await supabase
        .from('shared_content')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Increment view count
      await supabase
        .from('shared_content')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);

      return data;
    } catch (error) {
      console.error('Error getting shared content:', error);
      throw error;
    }
  }

  static async getUserShares(userId: string): Promise<SharedContent[]> {
    try {
      const { data, error } = await supabase
        .from('shared_content')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user shares:', error);
      throw error;
    }
  }

  static async deleteShare(shareId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shared_content')
        .delete()
        .eq('id', shareId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting share:', error);
      throw error;
    }
  }

  static async shareProduct(userId: string, productId: string): Promise<ShareResult> {
    try {
      // Get product details for metadata
      const { data: product } = await supabase
        .from('products')
        .select('name, price, main_image, category')
        .eq('id', productId)
        .single();

      return await this.createShare(userId, 'product', productId, {
        product_name: product?.name,
        product_price: product?.price,
        product_image: product?.main_image,
        product_category: product?.category
      });
    } catch (error) {
      console.error('Error sharing product:', error);
      throw error;
    }
  }

  static async shareConversation(userId: string, conversationId: string): Promise<ShareResult> {
    try {
      // Get conversation details for metadata
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('title, preview')
        .eq('id', conversationId)
        .single();

      return await this.createShare(userId, 'conversation', conversationId, {
        conversation_title: conversation?.title,
        conversation_preview: conversation?.preview
      });
    } catch (error) {
      console.error('Error sharing conversation:', error);
      throw error;
    }
  }

  static async shareWishlist(userId: string): Promise<ShareResult> {
    try {
      // Get wishlist items count for metadata
      const { data: wishlistItems } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', userId);

      return await this.createShare(userId, 'wishlist', userId, {
        items_count: wishlistItems?.length || 0
      });
    } catch (error) {
      console.error('Error sharing wishlist:', error);
      throw error;
    }
  }

  static async shareCart(userId: string): Promise<ShareResult> {
    try {
      // Get cart items count for metadata
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', userId);

      return await this.createShare(userId, 'cart', userId, {
        items_count: cartItems?.length || 0
      });
    } catch (error) {
      console.error('Error sharing cart:', error);
      throw error;
    }
  }
}
