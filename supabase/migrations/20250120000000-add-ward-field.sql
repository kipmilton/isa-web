-- Add ward field to profiles and delivery_personnel tables
-- This migration adds support for ward-level location data for delivery cost calculation

-- Add ward field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ward TEXT;

-- Add ward field to delivery_personnel table  
ALTER TABLE public.delivery_personnel
ADD COLUMN IF NOT EXISTS ward TEXT;

-- Add index for ward field in profiles table for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_ward ON public.profiles(ward);

-- Add index for ward field in delivery_personnel table for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_ward ON public.delivery_personnel(ward);

-- Add comment explaining the ward field usage
COMMENT ON COLUMN public.profiles.ward IS 'Ward information for delivery cost calculation. Only populated for Nairobi, Kiambu, Kajiado, and Machakos counties.';
COMMENT ON COLUMN public.delivery_personnel.ward IS 'Ward information for delivery cost calculation. Only populated for Nairobi, Kiambu, Kajiado, and Machakos counties.';
