-- Add return policy fields to products table (check if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'return_eligible') THEN
        ALTER TABLE public.products ADD COLUMN return_eligible boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'return_policy_guidelines') THEN
        ALTER TABLE public.products ADD COLUMN return_policy_guidelines text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'return_policy_reason') THEN
        ALTER TABLE public.products ADD COLUMN return_policy_reason text;
    END IF;
END $$;

-- Add order rating fields to orders table (check if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'product_rating') THEN
        ALTER TABLE public.orders ADD COLUMN product_rating integer CHECK (product_rating >= 1 AND product_rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_rating') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'product_review_comment') THEN
        ALTER TABLE public.orders ADD COLUMN product_review_comment text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_review_comment') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_review_comment text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'rated_at') THEN
        ALTER TABLE public.orders ADD COLUMN rated_at timestamp with time zone;
    END IF;
END $$;