-- Fix account_setup_completed status for existing profiles
-- Only mark as completed if they have all required customer fields

UPDATE profiles 
SET account_setup_completed = true 
WHERE user_type = 'customer' 
  AND first_name IS NOT NULL 
  AND last_name IS NOT NULL 
  AND phone_number IS NOT NULL 
  AND date_of_birth IS NOT NULL 
  AND gender IS NOT NULL 
  AND location IS NOT NULL;

-- Set account_setup_completed to false for profiles missing required fields
UPDATE profiles 
SET account_setup_completed = false 
WHERE user_type = 'customer' 
  AND (
    first_name IS NULL 
    OR last_name IS NULL 
    OR phone_number IS NULL 
    OR date_of_birth IS NULL 
    OR gender IS NULL 
    OR location IS NULL
  );

-- Calculate age for profiles that have date_of_birth but no age
UPDATE profiles 
SET age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth::date))
WHERE date_of_birth IS NOT NULL AND age IS NULL;
