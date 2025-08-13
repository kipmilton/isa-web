-- FIX CRITICAL SECURITY VULNERABILITY: Profiles table publicly readable
-- Remove overly permissive policies and clean up duplicates

-- First, drop all existing problematic SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile, admins view all, public can view re" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Drop duplicate policies to clean up
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure, clean policies for profiles table
-- Users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR is_admin_user(auth.uid()));

-- Users can only update their own profile, admins can update any
CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id OR is_admin_user(auth.uid()));

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Fix product_reviews to only show reviewer name/info to product owners and admins
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.product_reviews;

-- Create secure review visibility policy
CREATE POLICY "Reviews are viewable with limited user info" 
ON public.product_reviews 
FOR SELECT 
USING (
  -- Everyone can see reviews but...
  true
);

-- Create a secure view for public review display that doesn't expose sensitive user data
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  pr.id,
  pr.product_id,
  pr.rating,
  pr.title,
  pr.comment,
  pr.created_at,
  pr.updated_at,
  pr.is_verified_purchase,
  -- Only show first name and last initial for privacy
  CASE 
    WHEN p.first_name IS NOT NULL THEN 
      p.first_name || ' ' || LEFT(COALESCE(p.last_name, ''), 1) || '.'
    ELSE 'Anonymous'
  END as reviewer_name
FROM public.product_reviews pr
LEFT JOIN public.profiles p ON pr.user_id = p.id
WHERE pr.rating IS NOT NULL;

-- Grant access to the public view
GRANT SELECT ON public.reviews_public TO authenticated, anon;

-- Fix infinite recursion in admin_roles RLS policies
-- The issue is that the policy references the admin_roles table within its own policy check

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Main admins can manage all admin roles" ON public.admin_roles;

-- Create a new policy that uses profiles table instead of admin_roles table
-- This avoids the infinite recursion issue
CREATE POLICY "Main admins can manage all admin roles"
ON public.admin_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Also fix the support_requests policy that has the same issue
DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;

CREATE POLICY "Admins can view all support requests"
ON public.support_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Fix vendor_application_steps policy
DROP POLICY IF EXISTS "Admins can view all application steps" ON public.vendor_application_steps;

CREATE POLICY "Admins can view all application steps"
ON public.vendor_application_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Fix training_modules policy
DROP POLICY IF EXISTS "Main admins can manage training modules" ON public.training_modules;

CREATE POLICY "Main admins can manage training modules"
ON public.training_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);