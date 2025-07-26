-- Add account_setup_completed field to profiles table
ALTER TABLE profiles 
ADD COLUMN account_setup_completed BOOLEAN DEFAULT false;

-- Add age field to profiles table for account setup
ALTER TABLE profiles 
ADD COLUMN age INTEGER;

-- Update existing profiles to have account_setup_completed as true (they already have data)
UPDATE profiles 
SET account_setup_completed = true 
WHERE first_name IS NOT NULL AND last_name IS NOT NULL AND phone_number IS NOT NULL; 