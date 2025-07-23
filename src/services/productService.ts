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

  static async getProducts() {
    return await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
  }

  static async getCategories() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('name')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      return { data: [], error };
    }
    
    return { data: data?.map(cat => cat.name) || [], error: null };
  }

  static async createProduct(product: Omit<Product, 'id'>) {
    return await supabase
      .from('products')
      .insert([product])
      .select();
  }

  static async updateProduct(id: string, updates: Partial<Product>, vendorId?: string) {
    let query = supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    
    return await query.select();
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

  static async getProductsFiltered(category?: string, search?: string) {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (search && search.trim() !== '') {
      query = query.ilike('name', `%${search.trim()}%`);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching filtered products:', error);
      return [];
    }
    return data || [];
  }
}