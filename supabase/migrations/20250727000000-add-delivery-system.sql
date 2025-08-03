-- Add delivery system tables and functionality
-- This migration adds support for delivery personnel, location tracking, and delivery management

-- Create delivery_personnel table
CREATE TABLE IF NOT EXISTS public.delivery_personnel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  county TEXT NOT NULL,
  constituency TEXT NOT NULL,
  id_card_url TEXT NOT NULL,
  drivers_license_url TEXT NOT NULL,
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_orders table
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_personnel_id UUID REFERENCES public.delivery_personnel(id) ON DELETE SET NULL,
  pickup_location_lat DECIMAL(10, 8) NOT NULL,
  pickup_location_lng DECIMAL(11, 8) NOT NULL,
  pickup_location_address TEXT NOT NULL,
  delivery_location_lat DECIMAL(10, 8) NOT NULL,
  delivery_location_lng DECIMAL(11, 8) NOT NULL,
  delivery_location_address TEXT NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  tracking_updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_tracking table for real-time location updates
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_order_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  delivery_personnel_id UUID NOT NULL REFERENCES public.delivery_personnel(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  speed DECIMAL(8, 2),
  heading DECIMAL(5, 2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add location fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add delivery preferences to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'pickup' CHECK (delivery_type IN ('pickup', 'delivery')),
ADD COLUMN IF NOT EXISTS delivery_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_location_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0;

-- Enable Row Level Security for new tables
ALTER TABLE public.delivery_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Delivery personnel policies
CREATE POLICY "Delivery personnel can view their own profile" 
ON public.delivery_personnel 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Delivery personnel can update their own profile" 
ON public.delivery_personnel 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all delivery personnel" 
ON public.delivery_personnel 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Delivery orders policies
CREATE POLICY "Customers can view their own delivery orders" 
ON public.delivery_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = delivery_orders.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Delivery personnel can view assigned orders" 
ON public.delivery_orders 
FOR SELECT 
USING (
  delivery_personnel_id = (
    SELECT id FROM public.delivery_personnel 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Delivery personnel can update assigned orders" 
ON public.delivery_orders 
FOR UPDATE 
USING (
  delivery_personnel_id = (
    SELECT id FROM public.delivery_personnel 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all delivery orders" 
ON public.delivery_orders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Delivery tracking policies
CREATE POLICY "Delivery personnel can insert their own tracking data" 
ON public.delivery_tracking 
FOR INSERT 
WITH CHECK (
  delivery_personnel_id = (
    SELECT id FROM public.delivery_personnel 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Customers can view tracking for their orders" 
ON public.delivery_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_orders 
    JOIN public.orders ON orders.id = delivery_orders.order_id 
    WHERE delivery_orders.id = delivery_tracking.delivery_order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all tracking data" 
ON public.delivery_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_personnel_updated_at
BEFORE UPDATE ON public.delivery_personnel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at
BEFORE UPDATE ON public.delivery_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_user_id ON public.delivery_personnel(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_status ON public.delivery_personnel(status);
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_location ON public.delivery_personnel(current_location_lat, current_location_lng);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_order_id ON public.delivery_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_delivery_personnel_id ON public.delivery_orders(delivery_personnel_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery_order_id ON public.delivery_tracking(delivery_order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_timestamp ON public.delivery_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON public.orders(delivery_type);

-- Create function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL, lng1 DECIMAL, 
  lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate delivery fee (40 KES per km)
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
  distance_km DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN GREATEST(distance_km * 40, 100); -- Minimum 100 KES delivery fee
END;
$$ LANGUAGE plpgsql; 