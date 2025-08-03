-- Fix delivery personnel INSERT policy
-- This migration adds the missing INSERT policy that allows users to create their initial delivery personnel profile

-- Add INSERT policy for delivery personnel registration
CREATE POLICY "Users can insert their own delivery personnel profile" 
ON public.delivery_personnel 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for profiles table (for delivery users)
-- Note: We'll drop and recreate to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id); 