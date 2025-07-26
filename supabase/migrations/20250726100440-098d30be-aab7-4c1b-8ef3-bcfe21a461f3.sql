-- Add account_setup_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_setup_completed BOOLEAN DEFAULT false;

-- Update existing profiles to mark form-filled users as completed
UPDATE public.profiles 
SET account_setup_completed = true 
WHERE first_name IS NOT NULL 
AND last_name IS NOT NULL 
AND user_type IS NOT NULL;