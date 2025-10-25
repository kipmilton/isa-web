-- Fix infinite recursion in admin_roles policy and create missing tables

-- Drop the problematic policy if it exists
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

