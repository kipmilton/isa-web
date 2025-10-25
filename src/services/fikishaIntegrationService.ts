import { supabase } from "@/integrations/supabase/client";
import { FIKISHA_CONFIG } from "@/config/fikisha";

export interface FikishaDeliveryTask {
  id: string;
  tracking_code: string;
  sender_id: string;
  receiver_name: string;
  receiver_phone: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  package_description: string;
  delivery_amount: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';
  confirmation_code: string;
  estimated_delivery_time?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  
  // Additional fields for integration
  vendor_whatsapp?: string;
  customer_whatsapp?: string;
  vendor_county?: string;
  vendor_constituency?: string;
  vendor_ward?: string;
  customer_county?: string;
  customer_constituency?: string;
  customer_ward?: string;
  distance_km: number;
  original_order_id: string;
}

export class FikishaIntegrationService {
  // Check if integration is enabled
  private static isIntegrationEnabled(): boolean {
    return FIKISHA_CONFIG.ENABLED;
  }
  
  // Send delivery task to Fikisha (works for both website and app orders)
  static async sendDeliveryTaskToFikisha(
    deliveryOrderId: string,
    orderId: string
  ): Promise<{ success: boolean; error?: string; fikishaOrderId?: string }> {
    // Check if integration is enabled
    if (!this.isIntegrationEnabled()) {
      console.log('Fikisha integration is disabled');
      return { success: true, fikishaOrderId: 'disabled' };
    }

    try {
      // Get delivery order with all related data
      const { data: deliveryOrder, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders(
            id,
            customer_email,
            customer_phone,
            order_number,
            total_amount,
            created_at,
            vendor:profiles!orders_vendor_id_fkey(
              id,
              phone_number,
              county,
              constituency,
              ward
            ),
            customer:profiles!orders_user_id_fkey(
              id,
              phone_number,
              county,
              constituency,
              ward
            )
          )
        `)
        .eq('id', deliveryOrderId)
        .single();

      if (deliveryError || !deliveryOrder) {
        throw new Error(`Failed to fetch delivery order: ${deliveryError?.message}`);
      }

      // Get vendor information from products in the order
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product:products(
            vendor_id,
            vendor:profiles!products_vendor_id_fkey(
              phone_number,
              county,
              constituency,
              ward
            )
          )
        `)
        .eq('order_id', orderId);

      const vendor = orderItems?.[0]?.product?.vendor;

      // Prepare Fikisha task data
      const fikishaTask: FikishaDeliveryTask = {
        id: deliveryOrder.id,
        tracking_code: `ISA${deliveryOrder.id.substring(0, 8).toUpperCase()}`,
        sender_id: deliveryOrder.order.vendor?.id || 'unknown',
        receiver_name: deliveryOrder.order.customer?.full_name || 'Customer',
        receiver_phone: deliveryOrder.order.customer_phone || deliveryOrder.order.customer?.phone_number || '',
        pickup_address: deliveryOrder.pickup_location_address,
        pickup_latitude: deliveryOrder.pickup_location_lat,
        pickup_longitude: deliveryOrder.pickup_location_lng,
        delivery_address: deliveryOrder.delivery_location_address,
        delivery_latitude: deliveryOrder.delivery_location_lat,
        delivery_longitude: deliveryOrder.delivery_location_lng,
        package_description: `Order #${deliveryOrder.order.order_number}`,
        delivery_amount: deliveryOrder.delivery_fee,
        status: 'pending',
        confirmation_code: this.generateConfirmationCode(),
        estimated_delivery_time: deliveryOrder.estimated_delivery_time,
        created_at: deliveryOrder.created_at,
        updated_at: deliveryOrder.updated_at,
        
        // Additional integration fields
        vendor_whatsapp: vendor?.phone_number || deliveryOrder.order.vendor?.phone_number,
        customer_whatsapp: deliveryOrder.order.customer_phone || deliveryOrder.order.customer?.phone_number,
        vendor_county: vendor?.county || deliveryOrder.order.vendor?.county,
        vendor_constituency: vendor?.constituency || deliveryOrder.order.vendor?.constituency,
        vendor_ward: vendor?.ward || deliveryOrder.order.vendor?.ward,
        customer_county: deliveryOrder.order.customer?.county,
        customer_constituency: deliveryOrder.order.customer?.constituency,
        customer_ward: deliveryOrder.order.customer?.ward,
        distance_km: deliveryOrder.distance_km,
        original_order_id: orderId
      };

      // Send to Fikisha API
      const response = await fetch(`${FIKISHA_CONFIG.API_URL}/delivery-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIKISHA_CONFIG.API_KEY}`
        },
        body: JSON.stringify(fikishaTask)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Fikisha API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Update delivery order with Fikisha reference and tracking code
      await supabase
        .from('delivery_orders')
        .update({ 
          status: 'assigned',
          // Store Fikisha order ID and tracking code for future reference
          tracking_updates: [{ 
            type: 'sent_to_fikisha', 
            fikisha_order_id: result.id,
            fikisha_tracking_code: result.trackingCode,
            timestamp: new Date().toISOString() 
          }]
        })
        .eq('id', deliveryOrderId);

      return { 
        success: true, 
        fikishaOrderId: result.id,
        trackingCode: result.trackingCode
      };

    } catch (error) {
      console.error('Error sending delivery task to Fikisha:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update delivery status from Fikisha
  static async updateDeliveryStatus(
    deliveryOrderId: string,
    status: string,
    additionalData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          status: status,
          ...additionalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryOrderId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Generate confirmation code
  private static generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Get delivery tasks from Fikisha (for status updates)
  static async getFikishaDeliveryStatus(fikishaOrderId: string): Promise<any> {
    if (!this.isIntegrationEnabled()) {
      return null;
    }

    try {
      const response = await fetch(`${FIKISHA_CONFIG.API_URL}/delivery-tasks/${fikishaOrderId}`, {
        headers: {
          'Authorization': `Bearer ${FIKISHA_CONFIG.API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Fikisha delivery status:', error);
      return null;
    }
  }
}
