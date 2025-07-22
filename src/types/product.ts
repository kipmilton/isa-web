export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  main_image?: string;
  images?: string[];
  stock_quantity?: number;
  rating?: number;
  review_count?: number;
  is_featured?: boolean;
  is_active?: boolean;
  vendor_id?: string;
  pickup_location?: string;
  pickup_phone_number?: string;
  currency?: string;
  specifications?: any;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}