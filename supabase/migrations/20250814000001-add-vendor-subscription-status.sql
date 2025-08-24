-- Add vendor subscription status control
-- This allows admins to enable/disable vendor subscriptions

-- Add subscription_enabled field to points_config table
ALTER TABLE public.points_config 
ADD COLUMN IF NOT EXISTS vendor_subscription_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add subscription_enabled field to vendor_subscriptions table for tracking
ALTER TABLE public.vendor_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_enabled_at TIMESTAMP WITH TIME ZONE;

-- Create function to enable vendor subscriptions
CREATE OR REPLACE FUNCTION public.enable_vendor_subscriptions()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update points_config to enable vendor subscriptions
  INSERT INTO public.points_config (vendor_subscription_enabled)
  VALUES (true)
  ON CONFLICT DO NOTHING;
  
  -- Update existing vendor_subscriptions to mark when they were enabled
  UPDATE public.vendor_subscriptions 
  SET subscription_enabled_at = now()
  WHERE subscription_enabled_at IS NULL;
  
  RETURN true;
END;
$$;

-- Create function to disable vendor subscriptions
CREATE OR REPLACE FUNCTION public.disable_vendor_subscriptions()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update points_config to disable vendor subscriptions
  INSERT INTO public.points_config (vendor_subscription_enabled)
  VALUES (false)
  ON CONFLICT DO NOTHING;
  
  RETURN true;
END;
$$;
