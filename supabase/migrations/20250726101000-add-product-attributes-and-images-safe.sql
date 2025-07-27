-- Add product attributes and enhanced image support (Safe version)
-- Create product_attributes table for fashion items
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_images table for multiple images with descriptions
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_main_image BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_reviews table for customer reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, customer_id)
);

-- Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'product_attributes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'product_images' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'product_reviews' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Vendors can manage their product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Customers can view product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Vendors can manage their product images" ON public.product_images;
DROP POLICY IF EXISTS "Customers can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Customers can create reviews for products" ON public.product_reviews;
DROP POLICY IF EXISTS "Customers can update their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Everyone can view product reviews" ON public.product_reviews;

-- Product attributes policies
CREATE POLICY "Vendors can manage their product attributes" 
ON public.product_attributes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_attributes.product_id 
    AND products.vendor_id = auth.uid()
  )
);

CREATE POLICY "Customers can view product attributes" 
ON public.product_attributes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_attributes.product_id 
    AND products.is_active = true
  )
);

-- Product images policies
CREATE POLICY "Vendors can manage their product images" 
ON public.product_images 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_images.product_id 
    AND products.vendor_id = auth.uid()
  )
);

CREATE POLICY "Customers can view product images" 
ON public.product_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_images.product_id 
    AND products.is_active = true
  )
);

-- Product reviews policies
CREATE POLICY "Customers can create reviews for products" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own reviews" 
ON public.product_reviews 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Everyone can view product reviews" 
ON public.product_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_reviews.product_id 
    AND products.is_active = true
  )
);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_product_attributes_updated_at ON public.product_attributes;
DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.product_reviews;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_product_attributes_updated_at
BEFORE UPDATE ON public.product_attributes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON public.product_images(display_order);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer_id ON public.product_reviews(customer_id);

-- Add function to update product rating and review count
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Update product rating and review count
  UPDATE public.products 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger to automatically update product rating
CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating(); 