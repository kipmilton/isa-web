-- Fix infinite recursion in admin_roles policy
-- Run this in your Supabase SQL editor

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Users can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can view admin roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON admin_roles;

-- Create a simple, non-recursive policy
CREATE POLICY "Users can view admin roles" ON admin_roles
    FOR SELECT USING (true);

-- Also fix any other potentially problematic policies
DROP POLICY IF EXISTS "Users can view order returns" ON order_returns;
CREATE POLICY "Users can view order returns" ON order_returns
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can insert order returns" ON order_returns;
CREATE POLICY "Users can insert order returns" ON order_returns
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Ensure the order_returns table exists and has proper structure
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

