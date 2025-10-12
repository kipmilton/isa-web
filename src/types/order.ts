export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vendor_id?: string;
  product_sku?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  subtotal: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency?: string;
  customer_email: string;
  customer_phone?: string;
  fulfillment_method: string;
  pickup_phone?: string;
  pickup_location?: string;
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  packaging_guidelines?: string;
  customer_additional_requests?: string;
  completion_code?: string;
  delivery_photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderWithDetails extends Order {
  order_items?: OrderItem[];
}

export interface CartItemWithProduct {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    main_image?: string;
    category: string;
    stock_quantity: number;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentMethod {
  type: 'mpesa' | 'airtel_money';
  phoneNumber: string;
}

export interface DeliveryDetails {
  method: 'pickup' | 'delivery';
  address?: Address;
  fee: number;
}