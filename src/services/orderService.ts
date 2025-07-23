import { supabase } from "@/integrations/supabase/client";
import { OrderWithDetails } from "@/types/order";

export class OrderService {
  static async createOrder(userId: string, orderData: any) {
    // Simulate order creation
    return {
      id: `order_${Date.now()}`,
      order_number: `OR${Date.now()}`,
      user_id: userId,
      ...orderData
    };
  }
  static async getVendorOrders(vendorId: string): Promise<OrderWithDetails[]> {
    try {
      // Get orders that contain products from this vendor
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products!inner (
              vendor_id
            )
          )
        `)
        .eq('order_items.products.vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor orders:', error);
        return [];
      }

      return orders || [];
    } catch (error) {
      console.error('Exception fetching vendor orders:', error);
      return [];
    }
  }

  static async updateOrderStatus(orderId: string, status: string) {
    return await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
  }

  static async getCartItems(userId: string) {
    const { data, error } = await supabase
      .from('user_cart_items')
      .select('*')
      .eq('user_id', userId)
      .is('removed_at', null)
      .order('added_at', { ascending: false });
    if (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }
    return data || [];
  }

  static async addToCart(userId: string, item: { product_id: string; product_name?: string; product_category?: string; quantity?: number; price?: number; }) {
    const { error } = await supabase
      .from('user_cart_items')
      .insert({
        user_id: userId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_category: item.product_category,
        quantity: item.quantity || 1,
        price: item.price,
        added_at: new Date().toISOString(),
        removed_at: null
      });
    if (error) {
      throw new Error(error.message);
    }
  }

  static async removeFromCart(cartItemId: string) {
    const { error } = await supabase
      .from('user_cart_items')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', cartItemId);
    if (error) {
      throw new Error(error.message);
    }
  }

  static async updateCartItem(cartItemId: string, quantity: number) {
    const { error } = await supabase
      .from('user_cart_items')
      .update({ quantity })
      .eq('id', cartItemId);
    if (error) {
      throw new Error(error.message);
    }
  }

  static async getWishlistItems(userId: string) {
    const { data, error } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching wishlist items:', error);
      return [];
    }
    return data || [];
  }

  static async addToWishlist(userId: string, item: { product_id: string; product_name?: string; product_category?: string; }) {
    const { error } = await supabase
      .from('user_likes')
      .insert({
        user_id: userId,
        product_id: item.product_id,
        // Optionally store product_name/category for quick access
        // product_name: item.product_name,
        // product_category: item.product_category
      });
    if (error) {
      throw new Error(error.message);
    }
  }

  static async removeFromWishlist(userId: string, productId: string) {
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) {
      throw new Error(error.message);
    }
  }
}