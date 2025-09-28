export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory?: string;
  main_category?: string;
  sub_subcategory?: string;
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
  vendor?: {
    first_name?: string;
    last_name?: string;
  };
  pickup_location?: string;
  pickup_phone_number?: string;
  pickup_phone?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  currency?: string;
  specifications?: any;
  tags?: string[];
  commission_percentage?: number;
  ram?: string;
  storage?: string;
  processor?: string;
  display_size?: string;
  created_at?: string;
  updated_at?: string;
  banned?: boolean;
  banned_reason?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  return_eligible?: boolean;
  return_policy_guidelines?: string;
  return_policy_reason?: string;
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_name: string;
  attribute_value: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_description?: string;
  display_order: number;
  is_main_image: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  title?: string;
  is_verified_purchase?: boolean;
  created_at?: string;
  updated_at?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface FashionAttribute {
  size?: string;
  color?: string;
  material?: string;
  style?: string;
  gender?: string;
  age_group?: string;
  shoe_size?: string;
  clothing_type?: string;
}

export interface ElectronicsSpecification {
  ram?: string;
  storage?: string;
  processor?: string;
  display_size?: string;
  battery_capacity?: string;
  camera_resolution?: string;
  operating_system?: string;
  connectivity?: string;
  warranty?: string;
}