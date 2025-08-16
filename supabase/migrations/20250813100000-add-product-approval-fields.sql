-- Migration: Add product approval workflow fields
ALTER TABLE products
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN rejection_reason TEXT;
