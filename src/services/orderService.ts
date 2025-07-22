import { supabase } from "@/integrations/supabase/client";
import { OrderWithDetails } from "@/types/order";

export class OrderService {
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
}