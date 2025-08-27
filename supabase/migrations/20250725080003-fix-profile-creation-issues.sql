-- Fix profile creation issues and user_subscriptions table

-- First, let's ensure the profiles table has all required fields with proper defaults
ALTER TABLE profiles 
ALTER COLUMN first_name SET DEFAULT '',
ALTER COLUMN last_name SET DEFAULT '',
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN user_type SET DEFAULT 'customer',
ALTER COLUMN account_setup_completed SET DEFAULT false;

-- Update existing profiles to ensure they have proper values
UPDATE profiles 
SET 
  first_name = COALESCE(first_name, ''),
  last_name = COALESCE(last_name, ''),
  email = COALESCE(email, ''),
  user_type = COALESCE(user_type, 'customer'),
  account_setup_completed = COALESCE(account_setup_completed, false)
WHERE 
  first_name IS NULL 
  OR last_name IS NULL 
  OR email IS NULL 
  OR user_type IS NULL 
  OR account_setup_completed IS NULL;

-- Fix the account_setup_completed logic for existing profiles
-- Only mark as completed if they have all required customer fields
UPDATE profiles 
SET account_setup_completed = true 
WHERE user_type = 'customer' 
  AND first_name IS NOT NULL AND first_name != ''
  AND last_name IS NOT NULL AND last_name != ''
  AND phone_number IS NOT NULL AND phone_number != ''
  AND date_of_birth IS NOT NULL
  AND gender IS NOT NULL AND gender != ''
  AND location IS NOT NULL AND location != '';

-- Set account_setup_completed to false for profiles missing required fields
UPDATE profiles 
SET account_setup_completed = false 
WHERE user_type = 'customer' 
  AND (
    first_name IS NULL OR first_name = ''
    OR last_name IS NULL OR last_name = ''
    OR phone_number IS NULL OR phone_number = ''
    OR date_of_birth IS NULL
    OR gender IS NULL OR gender = ''
    OR location IS NULL OR location = ''
  );

-- Ensure user_subscriptions table has proper RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON public.user_subscriptions;

-- Recreate the policies with proper syntax
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions" 
ON public.user_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_id 
    AND profiles.user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
