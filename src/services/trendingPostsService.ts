import { supabase } from "@/integrations/supabase/client";

export interface TrendingPost {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  image_file_path?: string;
  link_url: string;
  button_text: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTrendingPostData {
  title: string;
  description: string;
  image_url?: string;
  image_file_path?: string;
  link_url: string;
  button_text?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateTrendingPostData {
  title?: string;
  description?: string;
  image_url?: string;
  image_file_path?: string;
  link_url?: string;
  button_text?: string;
  is_active?: boolean;
  sort_order?: number;
}

export class TrendingPostsService {
  static async getAllPosts(): Promise<{ data: TrendingPost[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trending_posts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      return { data: null, error };
    }
  }

  static async getActivePosts(): Promise<{ data: TrendingPost[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trending_posts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching active trending posts:', error);
      return { data: null, error };
    }
  }

  static async getPostById(id: string): Promise<{ data: TrendingPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trending_posts')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching trending post:', error);
      return { data: null, error };
    }
  }

  static async createPost(postData: CreateTrendingPostData): Promise<{ data: TrendingPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trending_posts')
        .insert([postData])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating trending post:', error);
      return { data: null, error };
    }
  }

  static async updatePost(id: string, postData: UpdateTrendingPostData): Promise<{ data: TrendingPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trending_posts')
        .update(postData)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating trending post:', error);
      return { data: null, error };
    }
  }

  static async deletePost(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('trending_posts')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error deleting trending post:', error);
      return { error };
    }
  }

  static async togglePostStatus(id: string, isActive: boolean): Promise<{ data: TrendingPost | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('trending_posts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error toggling trending post status:', error);
      return { data: null, error };
    }
  }

  static async reorderPosts(orderedIds: string[]): Promise<{ error: any }> {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index + 1
      }));

      for (const post of updates) {
        const { error } = await supabase
          .from('trending_posts')
          .update({ sort_order: post.sort_order })
          .eq('id', post.id);
        
        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error reordering trending posts:', error);
      return { error };
    }
  }
}
