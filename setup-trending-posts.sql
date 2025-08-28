-- Setup Trending Posts Table
-- Run this SQL in your Supabase SQL editor

-- Create trending_posts table
CREATE TABLE IF NOT EXISTS trending_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    image_file_path TEXT,
    link_url TEXT,
    button_text VARCHAR(100) DEFAULT 'Learn More',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_trending_posts_sort_order ON trending_posts(sort_order);
CREATE INDEX IF NOT EXISTS idx_trending_posts_active ON trending_posts(is_active);

-- Enable RLS
ALTER TABLE trending_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON trending_posts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON trending_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON trending_posts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON trending_posts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default trending posts
INSERT INTO trending_posts (title, description, image_file_path, link_url, button_text, sort_order) VALUES
(
    'ISA Goes Mobile!',
    'ISA is set to go live on Play Store and App Store on December 12th, 2025. Get ready for the ultimate mobile shopping experience!',
    '/isa-uploads/9d50b380-2e89-46c9-a242-8f5c708309df.png',
    '/chat',
    'Be the First to Know',
    1
),
(
    'NVIDIA Invests in Africa',
    'NVIDIA is now investing heavily in Africa to ensure they''re not left behind in the AI revolution. This means more tech opportunities for African businesses!',
    '/isa-uploads/ce883482-92de-4adf-a3c6-a0c82b907ebe.png',
    '/chat',
    'Learn More',
    2
),
(
    'Shop Jumia via ISA',
    'Exciting news! Buyers will now be able to order from Jumia directly through ISA. More choices, better deals, one platform!',
    '/isa-uploads/94a65745-ea22-43d2-a47c-5a99be9bfa56.png',
    '/chat',
    'Start Shopping',
    3
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_trending_posts_updated_at 
    BEFORE UPDATE ON trending_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
