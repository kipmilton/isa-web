import { useState } from 'react';

interface ProductImageFallbackProps {
  product: any;
  className?: string;
  alt?: string;
  onClick?: () => void;
}

const ProductImageFallback = ({ product, className = "", alt = "", onClick }: ProductImageFallbackProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // If we're trying to show a specific image (e.g., from product_images array)
  const [targetImageUrl, setTargetImageUrl] = useState<string | null>(null);

  // Get all available images for this product
  const getAvailableImages = () => {
    const images = [];
    
    // If we have a target image URL (e.g., from product_images array), prioritize it
    if (targetImageUrl) {
      images.push(targetImageUrl);
    }
    
    // Add main image if available (this could be from product_images array)
    if (product.main_image) {
      images.push(product.main_image);
    }
    
    // Add additional images if available
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images);
    }
    
    // Add product_images from database if available (but avoid duplicates)
    if (product.product_images && Array.isArray(product.product_images)) {
      const productImageUrls = product.product_images.map((img: any) => img.image_url);
      // Only add images that aren't already in the main_image
      const uniqueImages = productImageUrls.filter(img => img !== product.main_image);
      images.push(...uniqueImages);
    }
    
    return images.filter(img => img && img.trim() !== '');
  };

  const availableImages = getAvailableImages();
  const logoFallback = "/isa-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png";

  // Debug logging
  console.log('ProductImageFallback - Available images:', availableImages);
  console.log('ProductImageFallback - Current index:', currentImageIndex);
  console.log('ProductImageFallback - Image error:', imageError);

  const handleImageError = () => {
    console.log(`Image failed to load: ${availableImages[currentImageIndex]}`);
    if (currentImageIndex < availableImages.length - 1) {
      // Try next image
      console.log(`Trying next image: ${availableImages[currentImageIndex + 1]}`);
      setCurrentImageIndex(prev => prev + 1);
    } else {
      // All images failed, show logo fallback
      console.log('All images failed, showing logo fallback');
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    console.log(`Image loaded successfully: ${availableImages[currentImageIndex]}`);
    setImageError(false);
  };

  // If we have available images and haven't exhausted all options
  if (availableImages.length > 0 && currentImageIndex < availableImages.length && !imageError) {
    return (
      <img 
        src={availableImages[currentImageIndex]} 
        alt={alt || product.name} 
        className={className}
        onClick={onClick}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    );
  }

  // Final fallback - show blurred logo
  return (
    <div 
      className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden`}
      onClick={onClick}
    >
      <img 
        src={logoFallback} 
        alt="ISA Logo" 
        className="w-16 h-16 opacity-20 blur-sm"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gray-400 text-sm font-medium">ISA</span>
      </div>
    </div>
  );
};

export default ProductImageFallback;
