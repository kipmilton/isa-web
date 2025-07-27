import { supabase } from "@/integrations/supabase/client";
import { Product, ProductAttribute, ProductImage, ProductReview } from "@/types/product";

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

  // Product Attributes Methods
  static async getProductAttributes(productId: string) {
    const { data, error } = await supabase
      .from('product_attributes')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching product attributes:', error);
      return [];
    }
    return data || [];
  }

  static async createProductAttributes(productId: string, attributes: Omit<ProductAttribute, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) {
    const attributesWithProductId = attributes.map(attr => ({
      ...attr,
      product_id: productId
    }));

    return await supabase
      .from('product_attributes')
      .insert(attributesWithProductId)
      .select();
  }

  static async updateProductAttributes(productId: string, attributes: Omit<ProductAttribute, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) {
    // Delete existing attributes
    await supabase
      .from('product_attributes')
      .delete()
      .eq('product_id', productId);

    // Insert new attributes
    return await this.createProductAttributes(productId, attributes);
  }

  // Product Images Methods
  static async getProductImages(productId: string) {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
    return data || [];
  }

  static async createProductImages(productId: string, images: Omit<ProductImage, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) {
    const imagesWithProductId = images.map((img, index) => ({
      ...img,
      product_id: productId,
      display_order: index
    }));

    return await supabase
      .from('product_images')
      .insert(imagesWithProductId)
      .select();
  }

  static async updateProductImages(productId: string, images: Omit<ProductImage, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) {
    // Delete existing images
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    // Insert new images
    return await this.createProductImages(productId, images);
  }

  // Product Reviews Methods
  static async getProductReviews(productId: string) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        user:profiles!product_reviews_user_id_fkey(full_name, email)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching product reviews:', error);
      return [];
    }
    return data || [];
  }

  static async createProductReview(review: Omit<ProductReview, 'id' | 'created_at' | 'updated_at'>) {
    return await supabase
      .from('product_reviews')
      .insert([review])
      .select();
  }

  static async updateProductReview(id: string, updates: Partial<ProductReview>) {
    return await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', id)
      .select();
  }

  static async deleteProductReview(id: string, userId: string) {
    return await supabase
      .from('product_reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  }

  static async getUserReview(productId: string, userId: string) {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user review:', error);
      return null;
    }
    return data;
  }
}