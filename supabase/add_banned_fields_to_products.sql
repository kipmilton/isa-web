-- Migration: Add banned and banned_reason fields to products table
ALTER TABLE products
ADD COLUMN banned boolean NOT NULL DEFAULT false;

ALTER TABLE products
ADD COLUMN banned_reason text; 