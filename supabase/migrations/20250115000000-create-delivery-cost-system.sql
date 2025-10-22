-- Create delivery cost system tables and update location fields
-- This migration adds support for hierarchical delivery cost calculation

-- First, add separate location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS county TEXT,
ADD COLUMN IF NOT EXISTS constituency TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Add location fields to products table for vendor pickup locations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS pickup_county TEXT,
ADD COLUMN IF NOT EXISTS pickup_constituency TEXT,
ADD COLUMN IF NOT EXISTS pickup_ward TEXT;

-- Create counties table
CREATE TABLE IF NOT EXISTS public.counties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_hotspot BOOLEAN NOT NULL DEFAULT false, -- For Nairobi, Kiambu, Machakos, Kajiado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create constituencies table
CREATE TABLE IF NOT EXISTS public.constituencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, county_id)
);

-- Create wards table
CREATE TABLE IF NOT EXISTS public.wards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, constituency_id)
);

-- Create delivery base cost table
CREATE TABLE IF NOT EXISTS public.delivery_base_cost (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_cost DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create county-to-county delivery costs table
CREATE TABLE IF NOT EXISTS public.delivery_county_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  to_county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_county_id, to_county_id)
);

-- Create constituency-to-constituency delivery costs table
CREATE TABLE IF NOT EXISTS public.delivery_constituency_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_constituency_id UUID NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  to_constituency_id UUID NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_constituency_id, to_constituency_id)
);

-- Create ward-to-ward delivery costs table (for hotspot areas)
CREATE TABLE IF NOT EXISTS public.delivery_ward_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  to_ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_ward_id, to_ward_id)
);

-- Enable Row Level Security
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_base_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_county_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_constituency_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_ward_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for counties, constituencies, and wards (read-only for all users)
CREATE POLICY "Anyone can view counties" ON public.counties FOR SELECT USING (true);
CREATE POLICY "Anyone can view constituencies" ON public.constituencies FOR SELECT USING (true);
CREATE POLICY "Anyone can view wards" ON public.wards FOR SELECT USING (true);

-- Create RLS policies for delivery costs (admin only for management)
CREATE POLICY "Anyone can view delivery base cost" ON public.delivery_base_cost FOR SELECT USING (true);
CREATE POLICY "Anyone can view county costs" ON public.delivery_county_costs FOR SELECT USING (true);
CREATE POLICY "Anyone can view constituency costs" ON public.delivery_constituency_costs FOR SELECT USING (true);
CREATE POLICY "Anyone can view ward costs" ON public.delivery_ward_costs FOR SELECT USING (true);

-- Admin policies for managing costs
CREATE POLICY "Admins can manage delivery base cost" ON public.delivery_base_cost FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'order_admin')
  )
);

CREATE POLICY "Admins can manage county costs" ON public.delivery_county_costs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'order_admin')
  )
);

CREATE POLICY "Admins can manage constituency costs" ON public.delivery_constituency_costs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'order_admin')
  )
);

CREATE POLICY "Admins can manage ward costs" ON public.delivery_ward_costs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'order_admin')
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_counties_updated_at
BEFORE UPDATE ON public.counties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_constituencies_updated_at
BEFORE UPDATE ON public.constituencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wards_updated_at
BEFORE UPDATE ON public.wards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_base_cost_updated_at
BEFORE UPDATE ON public.delivery_base_cost
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_county_costs_updated_at
BEFORE UPDATE ON public.delivery_county_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_constituency_costs_updated_at
BEFORE UPDATE ON public.delivery_constituency_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_ward_costs_updated_at
BEFORE UPDATE ON public.delivery_ward_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_counties_name ON public.counties(name);
CREATE INDEX IF NOT EXISTS idx_counties_hotspot ON public.counties(is_hotspot);
CREATE INDEX IF NOT EXISTS idx_constituencies_county_id ON public.constituencies(county_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_name ON public.constituencies(name);
CREATE INDEX IF NOT EXISTS idx_wards_constituency_id ON public.wards(constituency_id);
CREATE INDEX IF NOT EXISTS idx_wards_name ON public.wards(name);
CREATE INDEX IF NOT EXISTS idx_delivery_county_costs_from_to ON public.delivery_county_costs(from_county_id, to_county_id);
CREATE INDEX IF NOT EXISTS idx_delivery_constituency_costs_from_to ON public.delivery_constituency_costs(from_constituency_id, to_constituency_id);
CREATE INDEX IF NOT EXISTS idx_delivery_ward_costs_from_to ON public.delivery_ward_costs(from_ward_id, to_ward_id);

-- Insert initial data for Kenya counties
INSERT INTO public.counties (name, is_hotspot) VALUES
('Nairobi County', true),
('Kiambu County', true),
('Machakos County', true),
('Kajiado County', true),
('Mombasa County', false),
('Kisumu County', false),
('Nakuru County', false),
('Eldoret County', false),
('Thika County', false),
('Malindi County', false),
('Kitale County', false),
('Garissa County', false),
('Kakamega County', false),
('Bungoma County', false),
('Busia County', false),
('Vihiga County', false),
('Siaya County', false),
('Kisii County', false),
('Nyamira County', false),
('Migori County', false),
('Homa Bay County', false),
('Kisumu County', false),
('Kericho County', false),
('Bomet County', false),
('Nandi County', false),
('Uasin Gishu County', false),
('Elgeyo-Marakwet County', false),
('West Pokot County', false),
('Trans Nzoia County', false),
('Samburu County', false),
('Turkana County', false),
('Marsabit County', false),
('Isiolo County', false),
('Meru County', false),
('Tharaka-Nithi County', false),
('Embu County', false),
('Kitui County', false),
('Makueni County', false),
('Taita-Taveta County', false),
('Kwale County', false),
('Kilifi County', false),
('Tana River County', false),
('Lamu County', false),
('Wajir County', false),
('Mandera County', false),
('Laikipia County', false),
('Nyeri County', false),
('Kirinyaga County', false),
('Murang\'a County', false),
('Nyandarua County', false);

-- Insert initial base cost
INSERT INTO public.delivery_base_cost (base_cost) VALUES (200.00);

-- Create function to calculate delivery cost
CREATE OR REPLACE FUNCTION calculate_delivery_cost(
  from_county_name TEXT,
  from_constituency_name TEXT DEFAULT NULL,
  from_ward_name TEXT DEFAULT NULL,
  to_county_name TEXT,
  to_constituency_name TEXT DEFAULT NULL,
  to_ward_name TEXT DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  base_cost DECIMAL(10, 2);
  county_cost DECIMAL(10, 2) := 0;
  constituency_cost DECIMAL(10, 2) := 0;
  ward_cost DECIMAL(10, 2) := 0;
  from_county_id UUID;
  to_county_id UUID;
  from_constituency_id UUID;
  to_constituency_id UUID;
  from_ward_id UUID;
  to_ward_id UUID;
BEGIN
  -- Get base cost
  SELECT d.base_cost INTO base_cost
  FROM public.delivery_base_cost d
  WHERE d.is_active = true
  ORDER BY d.created_at DESC
  LIMIT 1;
  
  IF base_cost IS NULL THEN
    base_cost := 200.00; -- Default base cost
  END IF;
  
  -- Get county IDs
  SELECT id INTO from_county_id FROM public.counties WHERE name = from_county_name;
  SELECT id INTO to_county_id FROM public.counties WHERE name = to_county_name;
  
  -- Calculate county cost if different counties
  IF from_county_id != to_county_id THEN
    SELECT COALESCE(dcc.cost, 0) INTO county_cost
    FROM public.delivery_county_costs dcc
    WHERE dcc.from_county_id = from_county_id 
    AND dcc.to_county_id = to_county_id
    AND dcc.is_active = true;
  END IF;
  
  -- Calculate constituency cost if provided and different constituencies
  IF from_constituency_name IS NOT NULL AND to_constituency_name IS NOT NULL THEN
    SELECT id INTO from_constituency_id 
    FROM public.constituencies 
    WHERE name = from_constituency_name AND county_id = from_county_id;
    
    SELECT id INTO to_constituency_id 
    FROM public.constituencies 
    WHERE name = to_constituency_name AND county_id = to_county_id;
    
    IF from_constituency_id != to_constituency_id THEN
      SELECT COALESCE(dcc.cost, 0) INTO constituency_cost
      FROM public.delivery_constituency_costs dcc
      WHERE dcc.from_constituency_id = from_constituency_id 
      AND dcc.to_constituency_id = to_constituency_id
      AND dcc.is_active = true;
    END IF;
  END IF;
  
  -- Calculate ward cost if provided and different wards (only for hotspot areas)
  IF from_ward_name IS NOT NULL AND to_ward_name IS NOT NULL THEN
    SELECT id INTO from_ward_id 
    FROM public.wards 
    WHERE name = from_ward_name AND constituency_id = from_constituency_id;
    
    SELECT id INTO to_ward_id 
    FROM public.wards 
    WHERE name = to_ward_name AND constituency_id = to_constituency_id;
    
    IF from_ward_id != to_ward_id THEN
      SELECT COALESCE(dwc.cost, 0) INTO ward_cost
      FROM public.delivery_ward_costs dwc
      WHERE dwc.from_ward_id = from_ward_id 
      AND dwc.to_ward_id = to_ward_id
      AND dwc.is_active = true;
    END IF;
  END IF;
  
  -- Return total cost: base + county + constituency + ward
  RETURN base_cost + county_cost + constituency_cost + ward_cost;
END;
$$ LANGUAGE plpgsql;
