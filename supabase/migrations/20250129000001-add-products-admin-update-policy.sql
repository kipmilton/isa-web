-- Add RLS policies to allow admins to update products and view orders
-- This is needed for product approval functionality and order management

-- Ensure RLS is enabled on products and orders tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;

-- Create policy to allow admins to update products (for approval workflow)
-- Use the helper function to avoid circular dependencies
CREATE POLICY "Admins can update all products"
ON public.products
FOR UPDATE
USING (
  public.has_admin_role(auth.uid(), 'main_admin') OR
  public.has_admin_role(auth.uid(), 'product_approver')
);

-- Also ensure admins can view all products
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;

CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (
  public.is_admin_active()  -- Use helper function to avoid circular dependencies
  OR auth.uid() IS NULL  -- Allow public to view active products
);

-- Drop existing orders policies if they exist
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  public.is_admin_active()  -- Use helper function to avoid circular dependencies
);

-- Allow admins to update orders
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (
  public.is_admin_active()  -- Use helper function to avoid circular dependencies
);

