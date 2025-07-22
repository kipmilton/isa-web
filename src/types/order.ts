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
  created_at?: string;
  updated_at?: string;
}

export interface OrderWithDetails extends Order {
  order_items?: OrderItem[];
}