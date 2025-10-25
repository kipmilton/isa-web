import { supabase } from '@/integrations/supabase/client';
import { DeliveryOrder } from '@/types/delivery';
import { FikishaIntegrationService } from './fikishaIntegrationService';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}


export class DeliveryService {
  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Calculate delivery fee (40 KES per km, minimum 100 KES)
  static calculateDeliveryFee(distanceKm: number): number {
    return Math.max(distanceKm * 40, 100);
  }

  // Create a delivery order
  static async createDeliveryOrder(
    orderId: string,
    pickupLocation: Location,
    deliveryLocation: Location
  ): Promise<{ data: DeliveryOrder | null; error: any }> {
    try {
      const distance = this.calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        deliveryLocation.lat,
        deliveryLocation.lng
      );
      
      const deliveryFee = this.calculateDeliveryFee(distance);

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert({
          order_id: orderId,
          pickup_location_lat: pickupLocation.lat,
          pickup_location_lng: pickupLocation.lng,
          pickup_location_address: pickupLocation.address,
          delivery_location_lat: deliveryLocation.lat,
          delivery_location_lng: deliveryLocation.lng,
          delivery_location_address: deliveryLocation.address,
          distance_km: distance,
          delivery_fee: deliveryFee,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Automatically send to Fikisha if delivery order was created successfully
      if (data) {
        try {
          const fikishaResult = await FikishaIntegrationService.sendDeliveryTaskToFikisha(
            data.id,
            orderId
          );
          
          if (!fikishaResult.success) {
            console.warn('Failed to send delivery task to Fikisha:', fikishaResult.error);
            // Don't fail the entire operation, just log the warning
          }
        } catch (fikishaError) {
          console.warn('Error sending to Fikisha:', fikishaError);
          // Don't fail the entire operation
        }
      }

      return { data: data as DeliveryOrder, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get delivery orders for a customer
  static async getCustomerDeliveryOrders(userId: string): Promise<{ data: DeliveryOrder[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders!inner(user_id)
        `)
        .eq('order.user_id', userId)
        .order('created_at', { ascending: false });

      return { data: data as DeliveryOrder[], error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get available delivery orders for delivery personnel
  static async getAvailableDeliveryOrders(): Promise<{ data: DeliveryOrder[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders(
            customer_email,
            customer_phone,
            order_number,
            total_amount
          )
        `)
        .is('delivery_personnel_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      return { data: data as DeliveryOrder[], error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get delivery orders assigned to a delivery personnel
  static async getDeliveryPersonnelOrders(userId: string): Promise<{ data: DeliveryOrder[] | null; error: any }> {
    try {
      // First get the delivery personnel ID
      const { data: deliveryPersonnel, error: personnelError } = await supabase
        .from('delivery_personnel')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (personnelError || !deliveryPersonnel) {
        return { data: null, error: personnelError };
      }

      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          order:orders(
            customer_email,
            customer_phone,
            order_number,
            total_amount
          )
        `)
        .eq('delivery_personnel_id', deliveryPersonnel.id)
        .order('created_at', { ascending: false });

      return { data: data as DeliveryOrder[], error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Accept a delivery order
  static async acceptDeliveryOrder(
    deliveryOrderId: string,
    userId: string
  ): Promise<{ data: any; error: any }> {
    try {
      // Get the delivery personnel ID
      const { data: deliveryPersonnel, error: personnelError } = await supabase
        .from('delivery_personnel')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (personnelError || !deliveryPersonnel) {
        return { data: null, error: personnelError };
      }

      const { data, error } = await supabase
        .from('delivery_orders')
        .update({
          delivery_personnel_id: deliveryPersonnel.id,
          status: 'assigned'
        })
        .eq('id', deliveryOrderId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update delivery status
  static async updateDeliveryStatus(
    deliveryOrderId: string,
    status: string,
    currentLocation?: { lat: number; lng: number }
  ): Promise<{ data: any; error: any }> {
    try {
      const updateData: any = { status };
      
      if (currentLocation) {
        updateData.current_location_lat = currentLocation.lat;
        updateData.current_location_lng = currentLocation.lng;
      }

      if (status === 'delivered') {
        updateData.actual_delivery_time = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('delivery_orders')
        .update(updateData)
        .eq('id', deliveryOrderId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update delivery personnel location
  static async updateDeliveryPersonnelLocation(
    userId: string,
    lat: number,
    lng: number
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .update({
          current_location_lat: lat,
          current_location_lng: lng
        })
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Add tracking update
  static async addTrackingUpdate(
    deliveryOrderId: string,
    deliveryPersonnelId: string,
    lat: number,
    lng: number,
    accuracy?: number,
    speed?: number,
    heading?: number
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .insert({
          delivery_order_id: deliveryOrderId,
          delivery_personnel_id: deliveryPersonnelId,
          latitude: lat,
          longitude: lng,
          accuracy,
          speed,
          heading
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get tracking updates for a delivery order
  static async getTrackingUpdates(deliveryOrderId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_order_id', deliveryOrderId)
        .order('timestamp', { ascending: false })
        .limit(50);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update delivery personnel online status
  static async updateOnlineStatus(
    userId: string,
    isOnline: boolean,
    isAvailable: boolean
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .update({
          is_online: isOnline,
          is_available: isAvailable
        })
        .eq('user_id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get delivery personnel profile
  static async getDeliveryPersonnelProfile(userId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
} 