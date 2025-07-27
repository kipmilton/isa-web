-- Add product attributes and enhanced image support (Corrected version)
-- Only create missing tables since product_reviews already exists

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

-- Enable Row Level Security for new tables
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
END $$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Vendors can manage their product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Customers can view product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Vendors can manage their product images" ON public.product_images;
DROP POLICY IF EXISTS "Customers can view product images" ON public.product_images;

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_product_attributes_updated_at ON public.product_attributes;
DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_product_attributes_updated_at
BEFORE UPDATE ON public.product_attributes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON public.product_images(display_order); 