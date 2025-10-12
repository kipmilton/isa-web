-- Add packaging guidelines and completion code to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS packaging_guidelines TEXT,
ADD COLUMN IF NOT EXISTS customer_additional_requests TEXT,
ADD COLUMN IF NOT EXISTS completion_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

-- Create order_messages table for customer-vendor communication
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'vendor')),
  message_text TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  CONSTRAINT message_content_check CHECK (
    message_text IS NOT NULL OR image_url IS NOT NULL
  )
);

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON public.order_messages(created_at DESC);

-- Create delivery_status_updates table for tracking delivery progress
CREATE TABLE IF NOT EXISTS public.delivery_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_personnel_id UUID,
  status TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_status_order_id ON public.delivery_status_updates(order_id);

-- Add RLS policies for order_messages
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view and send messages for their orders
CREATE POLICY "Customers can view messages for their orders"
ON public.order_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_messages.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can send messages for their orders"
ON public.order_messages FOR INSERT
WITH CHECK (
  sender_type = 'customer' AND
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_messages.order_id AND o.user_id = auth.uid()
  )
);

-- Vendors can view and send messages for orders containing their products
CREATE POLICY "Vendors can view messages for their orders"
ON public.order_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.id = order_messages.order_id AND p.vendor_id = auth.uid()
  )
);

CREATE POLICY "Vendors can send messages for their orders"
ON public.order_messages FOR INSERT
WITH CHECK (
  sender_type = 'vendor' AND
  image_url IS NOT NULL AND message_text IS NULL AND
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.id = order_messages.order_id AND p.vendor_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.order_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'order_admin')
    AND is_active = true
  )
);

-- Add RLS policies for delivery_status_updates
ALTER TABLE public.delivery_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view delivery status for their orders"
ON public.delivery_status_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = delivery_status_updates.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Delivery personnel can insert and view delivery status"
ON public.delivery_status_updates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_personnel dp
    WHERE dp.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view delivery status for their orders"
ON public.delivery_status_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_id = p.id
    WHERE o.id = delivery_status_updates.order_id AND p.vendor_id = auth.uid()
  )
);

-- Function to generate completion code
CREATE OR REPLACE FUNCTION public.generate_completion_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6));
END;
$$;