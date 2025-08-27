-- Migration: Update vendor application fields
-- Date: 2025-01-17
-- Description: Update vendor application form fields to support new structure

-- Add new columns to profiles table for vendor application data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS heard_about_us TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_holder_name TEXT;

-- Create a function to migrate existing vendor application data
CREATE OR REPLACE FUNCTION migrate_vendor_application_data()
RETURNS void AS $$
DECLARE
    app_record RECORD;
    v_step_data JSONB;
BEGIN
    -- Loop through existing vendor application steps
    FOR app_record IN 
        SELECT user_id, step_data AS app_step_data
        FROM vendor_application_steps
        WHERE step_name = 'application_form' 
        AND step_data IS NOT NULL
    LOOP
        v_step_data := app_record.app_step_data;
        
        -- Update profiles table with new fields
        UPDATE profiles 
        SET 
            heard_about_us = COALESCE(v_step_data->>'heardAboutUs', ''),
            brand_name = COALESCE(v_step_data->>'brandName', v_step_data->>'contactPerson', ''),
            website_url = COALESCE(v_step_data->>'websiteUrl', ''),
            bank_name = COALESCE(v_step_data->'documents'->>'bankName', ''),
            account_number = COALESCE(v_step_data->'documents'->>'accountNumber', ''),
            account_holder_name = COALESCE(v_step_data->'documents'->>'accountHolderName', '')
        WHERE id = app_record.user_id;
        
        -- Update the step_data to include new fields if they don't exist
        IF NOT (v_step_data ? 'heardAboutUs') THEN
            v_step_data := v_step_data || '{"heardAboutUs": ""}'::jsonb;
        END IF;
        
        IF NOT (v_step_data ? 'brandName') THEN
            -- Migrate contactPerson to brandName if it exists
            IF v_step_data ? 'contactPerson' THEN
                v_step_data := v_step_data || jsonb_build_object('brandName', v_step_data->>'contactPerson');
            ELSE
                v_step_data := v_step_data || '{"brandName": ""}'::jsonb;
            END IF;
        END IF;
        
        IF NOT (v_step_data ? 'websiteUrl') THEN
            v_step_data := v_step_data || '{"websiteUrl": ""}'::jsonb;
        END IF;
        
        -- Update documents structure
        IF v_step_data ? 'documents' THEN
            IF NOT (v_step_data->'documents' ? 'bankName') THEN
                v_step_data := jsonb_set(v_step_data, '{documents}', 
                    v_step_data->'documents' || '{"bankName": ""}'::jsonb);
            END IF;
            
            IF NOT (v_step_data->'documents' ? 'accountNumber') THEN
                v_step_data := jsonb_set(v_step_data, '{documents}', 
                    v_step_data->'documents' || '{"accountNumber": ""}'::jsonb);
            END IF;
            
            IF NOT (v_step_data->'documents' ? 'accountHolderName') THEN
                v_step_data := jsonb_set(v_step_data, '{documents}', 
                    v_step_data->'documents' || '{"accountHolderName": ""}'::jsonb);
            END IF;
            
            -- Remove old bankDetails field if it exists
            IF v_step_data->'documents' ? 'bankDetails' THEN
                v_step_data := jsonb_set(v_step_data, '{documents}', 
                    (v_step_data->'documents') - 'bankDetails');
            END IF;
        ELSE
            v_step_data := v_step_data || '{"documents": {"bankName": "", "accountNumber": "", "accountHolderName": ""}}'::jsonb;
        END IF;
        
        -- Update the vendor_application_steps table
        UPDATE vendor_application_steps 
        SET step_data = v_step_data
        WHERE user_id = app_record.user_id AND step_name = 'application_form';
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_vendor_application_data();

-- Drop the migration function
DROP FUNCTION migrate_vendor_application_data();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_heard_about_us ON profiles(heard_about_us);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_name ON profiles(brand_name);
CREATE INDEX IF NOT EXISTS idx_profiles_website_url ON profiles(website_url);

-- Add comments to document the new fields
COMMENT ON COLUMN profiles.heard_about_us IS 'How the vendor heard about ISA platform';
COMMENT ON COLUMN profiles.brand_name IS 'Vendor brand name';
COMMENT ON COLUMN profiles.website_url IS 'Vendor website or social media URL';
COMMENT ON COLUMN profiles.bank_name IS 'Bank name for vendor payments';
COMMENT ON COLUMN profiles.account_number IS 'Bank account number for vendor payments';
COMMENT ON COLUMN profiles.account_holder_name IS 'Bank account holder name for vendor payments';
