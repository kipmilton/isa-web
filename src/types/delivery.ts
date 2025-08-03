export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  county?: string;
}

export interface DeliveryPersonnel {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  county: string;
  constituency: string;
  id_card_url: string;
  drivers_license_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  is_available: boolean;
  is_online: boolean;
  current_location_lat?: number;
  current_location_lng?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryOrder {
  id: string;
  order_id: string;
  delivery_personnel_id?: string;
  status: string;
  pickup_location_lat: number;
  pickup_location_lng: number;
  pickup_location_address: string;
  delivery_location_lat: number;
  delivery_location_lng: number;
  delivery_location_address: string;
  distance_km: number;
  delivery_fee: number;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  current_location_lat?: number;
  current_location_lng?: number;
  tracking_updates: any;
  created_at: string;
  updated_at: string;
  order?: any;
  delivery_personnel?: any;
}

export interface DeliveryItem {
  weight: number;
  quantity: number;
  isFragile: boolean;
}

export interface DeliveryFeeRequest {
  pickupLocation: DeliveryLocation;
  deliveryLocation: DeliveryLocation;
  items: DeliveryItem[];
  deliveryType: 'standard' | 'express';
}

export interface DeliveryFeeResponse {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  totalFee: number;
  distance: number;
  estimatedTime: string;
}

export type UserType = 'customer' | 'vendor' | 'admin' | 'delivery';
export type UserStatus = 'pending' | 'approved' | 'rejected';