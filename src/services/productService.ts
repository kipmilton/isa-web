import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export class ProductService {
  static async getProductsByVendor(vendorId: string) {
    return await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
  }

  static async createProduct(product: Omit<Product, 'id'>) {
    return await supabase
      .from('products')
      .insert([product])
      .select();
  }

  static async updateProduct(id: string, updates: Partial<Product>) {
    return await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
  }

  static async deleteProduct(id: string) {
    return await supabase
      .from('products')
      .delete()
      .eq('id', id);
  }

  static async getProduct(id: string) {
    return await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
  }
}