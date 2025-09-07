-- Add missing columns to points_config table
ALTER TABLE public.points_config 
ADD COLUMN IF NOT EXISTS redemption_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS vendor_subscription_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_premium_enabled boolean NOT NULL DEFAULT false;

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_holder_name text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Create user_notifications table for the notification system
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.user_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.user_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.user_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create delivery_applications table 
CREATE TABLE IF NOT EXISTS public.delivery_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  county TEXT NOT NULL,
  constituency TEXT NOT NULL,
  id_card_url TEXT NOT NULL,
  drivers_license_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on delivery_applications
ALTER TABLE public.delivery_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_applications
CREATE POLICY "Users can view their own applications" 
ON public.delivery_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" 
ON public.delivery_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" 
ON public.delivery_applications 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- Add missing columns to vendor_commissions table
ALTER TABLE public.vendor_commissions 
ADD COLUMN IF NOT EXISTS main_category text,
ADD COLUMN IF NOT EXISTS category_path text;

-- Update existing vendor_commissions records to have proper category structure
UPDATE public.vendor_commissions 
SET main_category = category, category_path = category 
WHERE main_category IS NULL OR category_path IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_delivery_applications_status ON public.delivery_applications(status);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_notifications_updated_at ON public.user_notifications;
CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_applications_updated_at ON public.delivery_applications;
CREATE TRIGGER update_delivery_applications_updated_at
    BEFORE UPDATE ON public.delivery_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();