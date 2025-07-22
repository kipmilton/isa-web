import { supabase } from "@/integrations/supabase/client";

export class ImageUploadService {
  static async uploadImage(file: File, bucket: string = 'product-images') {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { error: error.message, url: '' };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { error: null, url: publicUrl };
    } catch (error) {
      console.error('Upload exception:', error);
      return { error: 'Upload failed', url: '' };
    }
  }

  static async deleteImage(path: string, bucket: string = 'product-images') {
    return await supabase.storage
      .from(bucket)
      .remove([path]);
  }
}