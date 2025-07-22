import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { ImageUploadService } from "@/services/imageUploadService";

interface ImageUploadProps {
  onImageUpload: (result: { url: string; error?: string }) => void;
  onImageRemove: (imageUrl: string) => void;
  existingImages?: string[];
  multiple?: boolean;
  maxImages?: number;
}

const ImageUpload = ({ 
  onImageUpload, 
  onImageRemove, 
  existingImages = [], 
  multiple = false, 
  maxImages = 5 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if we've reached max images
      if (!multiple && existingImages.length >= 1) break;
      if (multiple && existingImages.length >= maxImages) break;

      // Validate file size (500KB limit)
      if (file.size > 500 * 1024) {
        onImageUpload({ url: '', error: 'Image must be less than 500KB' });
        continue;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        onImageUpload({ url: '', error: 'Please select an image file' });
        continue;
      }

      setUploading(true);
      try {
        const result = await ImageUploadService.uploadImage(file, 'product-images');
        onImageUpload(result);
      } catch (error) {
        onImageUpload({ url: '', error: 'Upload failed' });
      } finally {
        setUploading(false);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canUploadMore = multiple ? existingImages.length < maxImages : existingImages.length === 0;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-6">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {existingImages.length === 0 ? 'Upload Images' : 'Add More Images'}
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Max file size: 500KB. Supported formats: JPG, PNG, GIF
                {multiple && ` (Max ${maxImages} images)`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onImageRemove(imageUrl)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Main
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {existingImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
