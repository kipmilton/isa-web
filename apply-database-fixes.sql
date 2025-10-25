-- Apply database fixes manually
-- Run this in your Supabase SQL Editor

-- Fix the infinite recursion in admin_roles policy
DROP POLICY IF EXISTS "Users can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON admin_roles;

-- Create a simple, non-recursive policy
CREATE POLICY "Users can view admin roles" ON admin_roles
    FOR SELECT USING (true);

-- Create order_returns table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    return_type TEXT NOT NULL CHECK (return_type IN ('replacement', 'exchange', 'refund')),
    customer_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on order_returns
ALTER TABLE order_returns ENABLE ROW LEVEL SECURITY;

-- Create policies for order_returns
DROP POLICY IF EXISTS "Users can view order returns" ON order_returns;
CREATE POLICY "Users can view order returns" ON order_returns
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert order returns" ON order_returns;
CREATE POLICY "Users can insert order returns" ON order_returns
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Create delivery_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS delivery_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    pickup_location_address TEXT,
    pickup_location_lat DECIMAL(10, 8),
    pickup_location_lng DECIMAL(11, 8),
    delivery_location_address TEXT,
    delivery_location_lat DECIMAL(10, 8),
    delivery_location_lng DECIMAL(11, 8),
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    distance_km DECIMAL(8, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')),
    tracking_updates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on delivery_orders
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_orders
DROP POLICY IF EXISTS "Users can view delivery orders" ON delivery_orders;
CREATE POLICY "Users can view delivery orders" ON delivery_orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert delivery orders" ON delivery_orders;
CREATE POLICY "Users can insert delivery orders" ON delivery_orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update delivery orders" ON delivery_orders;
CREATE POLICY "Users can update delivery orders" ON delivery_orders
    FOR UPDATE USING (true);

-- Add missing product columns for comprehensive product management
-- This ensures all required columns exist in the products table

-- Add brand level column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_level TEXT;

-- Add main category and sub-subcategory columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS main_category TEXT,
ADD COLUMN IF NOT EXISTS sub_subcategory TEXT;

-- Add commission percentage column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0.00;

-- Add pickup location details
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS pickup_county TEXT,
ADD COLUMN IF NOT EXISTS pickup_constituency TEXT,
ADD COLUMN IF NOT EXISTS pickup_ward TEXT;

-- Add return policy columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS return_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_policy_guidelines TEXT,
ADD COLUMN IF NOT EXISTS return_policy_reason TEXT;

-- Add product dimensions and weight
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2);

-- Add warranty information
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty_period INTEGER,
ADD COLUMN IF NOT EXISTS warranty_unit TEXT CHECK (warranty_unit IN ('days', 'weeks', 'months', 'years')),
ADD COLUMN IF NOT EXISTS has_warranty BOOLEAN DEFAULT false;

-- Add delivery methods (as JSONB array) - THIS IS THE KEY COLUMN THAT'S MISSING
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_methods JSONB DEFAULT '[]'::jsonb;

-- Add materials (as JSONB array)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;

-- Add extended electronics specifications
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_resolution TEXT,
ADD COLUMN IF NOT EXISTS display_size_inch DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS hdd_size TEXT,
ADD COLUMN IF NOT EXISTS memory_capacity_gb INTEGER,
ADD COLUMN IF NOT EXISTS system_memory TEXT,
ADD COLUMN IF NOT EXISTS storage_capacity_gb INTEGER,
ADD COLUMN IF NOT EXISTS battery_capacity_mah INTEGER,
ADD COLUMN IF NOT EXISTS cpu_manufacturer TEXT,
ADD COLUMN IF NOT EXISTS processor_type TEXT,
ADD COLUMN IF NOT EXISTS graphics_memory_gb INTEGER,
ADD COLUMN IF NOT EXISTS memory_technology TEXT,
ADD COLUMN IF NOT EXISTS panel_type TEXT,
ADD COLUMN IF NOT EXISTS plug_type TEXT,
ADD COLUMN IF NOT EXISTS voltage TEXT,
ADD COLUMN IF NOT EXISTS mount_type TEXT,
ADD COLUMN IF NOT EXISTS modem_type TEXT,
ADD COLUMN IF NOT EXISTS connection_gender TEXT;

-- Add location columns for geolocation
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

