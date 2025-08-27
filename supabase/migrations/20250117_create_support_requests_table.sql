-- Migration: Create support_requests table
-- Date: 2025-01-17
-- Description: Create table to store vendor support requests from onboarding and training

-- Create support_requests table
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'general_inquiry',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    resolution_note TEXT,
    
    -- Add constraints
    CONSTRAINT valid_phone_number CHECK (phone_number ~ '^\+?[0-9\s\-\(\)]+$'),
    CONSTRAINT valid_request_type CHECK (request_type IN ('training_help', 'onboarding_help', 'technical_support', 'general_inquiry'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON support_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_support_requests_request_type ON support_requests(request_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_support_requests_status_created ON support_requests(status, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own support requests
CREATE POLICY "Users can view own support requests" ON support_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own support requests
CREATE POLICY "Users can insert own support requests" ON support_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all support requests
CREATE POLICY "Admins can view all support requests" ON support_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can update support requests
CREATE POLICY "Admins can update support requests" ON support_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add comments to document the table
COMMENT ON TABLE support_requests IS 'Stores vendor support requests from onboarding and training processes';
COMMENT ON COLUMN support_requests.user_id IS 'Reference to the vendor/user who submitted the request';
COMMENT ON COLUMN support_requests.phone_number IS 'Phone number provided by the vendor for contact';
COMMENT ON COLUMN support_requests.message IS 'Support request message from the vendor';
COMMENT ON COLUMN support_requests.request_type IS 'Type of support request (training_help, onboarding_help, technical_support, general_inquiry)';
COMMENT ON COLUMN support_requests.status IS 'Current status of the request (pending, in_progress, resolved)';
COMMENT ON COLUMN support_requests.resolved_at IS 'Timestamp when the request was resolved';
COMMENT ON COLUMN support_requests.resolved_by IS 'Admin who resolved the request';
COMMENT ON COLUMN support_requests.resolution_note IS 'Optional note about how the request was resolved';
