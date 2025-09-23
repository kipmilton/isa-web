-- Add brand level field to products table
ALTER TABLE public.products ADD COLUMN brand_level text CHECK (brand_level IN ('entry', 'medium', 'high')) DEFAULT 'entry';

-- Create support tickets table
CREATE TABLE public.support_tickets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL DEFAULT 'general',
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    response text,
    responded_by uuid,
    responded_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for support_tickets
CREATE POLICY "Users can create their own tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets
FOR ALL
USING (is_admin_user(auth.uid()));

-- Create wishlist groups table for enhanced wishlist functionality
CREATE TABLE public.wishlist_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    hashtag text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS on wishlist_groups
ALTER TABLE public.wishlist_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for wishlist_groups
CREATE POLICY "Users can manage their own wishlist groups"
ON public.wishlist_groups
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Modify user_likes table to support grouping
ALTER TABLE public.user_likes ADD COLUMN wishlist_group_id uuid REFERENCES public.wishlist_groups(id) ON DELETE SET NULL;
ALTER TABLE public.user_likes ADD COLUMN custom_note text;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_support_tickets_updated_at();

CREATE TRIGGER update_wishlist_groups_updated_at
    BEFORE UPDATE ON public.wishlist_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();