-- Ensure ban fields exist on products table for admin ban/unban actions
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS banned_reason text;



