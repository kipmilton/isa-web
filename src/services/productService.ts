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
      .insert([{ ...product, status: 'pending' }])
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
      .select(`
        *,
        vendor:profiles!products_vendor_id_fkey(first_name, last_name, company, brand_name)
      `)
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
    const { data, error } = await (supabase as any)
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

    return await (supabase as any)
      .from('product_attributes')
      .insert(attributesWithProductId)
      .select();
  }

  static async updateProductAttributes(productId: string, attributes: Omit<ProductAttribute, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) {
    // Delete existing attributes
    await (supabase as any)
      .from('product_attributes')
      .delete()
      .eq('product_id', productId);

    // Insert new attributes
    return await this.createProductAttributes(productId, attributes);
  }

  // Product Images Methods
  static async getProductImages(productId: string) {
    const { data, error } = await (supabase as any)
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

    return await (supabase as any)
      .from('product_images')
      .insert(imagesWithProductId)
      .select();
  }

  static async updateProductImages(productId: string, images: Omit<ProductImage, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]) {
    // Delete existing images
    await (supabase as any)
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
        user:profiles!product_reviews_user_id_fkey(first_name, last_name, email)
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

  static async fetchNotificationsByVendor(vendorId: string) {
    return await supabase
      .from('notifications')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
  }

  static async markNotificationAsRead(notificationId: string) {
    return await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  static async createNotification({ product_id, vendor_id, type, message }: { product_id: string, vendor_id: string, type: string, message: string }) {
    return await supabase
      .from('notifications')
      .insert([{ product_id, vendor_id, type, message, read: false }]);
  }

  static async getSimilarProducts(productId: string, subcategory?: string) {
    // First get the current product to get its subcategory
    const { data: currentProduct, error: productError } = await supabase
      .from('products')
      .select('subcategory, category')
      .eq('id', productId)
      .single();

    if (productError || !currentProduct) {
      console.error('Error fetching current product:', productError);
      return [];
    }

    // Fetch products with same subcategory (if available) or same category
    let query = supabase
      .from('products')
      .select('*')
      .neq('id', productId)
      .eq('status', 'approved')
      .limit(20);

    if (currentProduct.subcategory) {
      query = query.eq('subcategory', currentProduct.subcategory);
    } else {
      query = query.eq('category', currentProduct.category);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
    
    return data || [];
  }
}