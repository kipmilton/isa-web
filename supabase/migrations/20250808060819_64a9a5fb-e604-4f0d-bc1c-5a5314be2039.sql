-- ISA Loyalty Rewards Program Database Schema

-- Points configuration table (admin configurable)
CREATE TABLE public.points_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  point_value_kes numeric NOT NULL DEFAULT 0.10, -- 1 point = KES 0.10
  spending_points_per_100_kes integer NOT NULL DEFAULT 10,
  first_purchase_points integer NOT NULL DEFAULT 100,
  referral_signup_points integer NOT NULL DEFAULT 200,
  referral_purchase_points integer NOT NULL DEFAULT 200,
  quiz_completion_points integer NOT NULL DEFAULT 20,
  points_expiry_months integer NOT NULL DEFAULT 12,
  redemption_enabled boolean NOT NULL DEFAULT false,
  vendor_subscription_enabled boolean NOT NULL DEFAULT false,
  customer_premium_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User points balance
CREATE TABLE public.user_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  available_points integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_redeemed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Points transactions history
CREATE TABLE public.points_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired')),
  points integer NOT NULL,
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User referrals tracking
CREATE TABLE public.user_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  signup_points_awarded boolean NOT NULL DEFAULT false,
  purchase_points_awarded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

-- Style quiz questions
CREATE TABLE public.style_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  question_text text NOT NULL,
  question_order integer NOT NULL,
  options jsonb NOT NULL, -- Array of option objects with text and value
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User quiz responses
CREATE TABLE public.user_quiz_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.style_quiz_questions(id) ON DELETE CASCADE,
  selected_option jsonb NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enhanced vendor commission rates per category with full hierarchy support
CREATE TABLE public.vendor_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_category text NOT NULL,
  subcategory text,
  sub_subcategory text,
  category_path text NOT NULL, -- Full path like "Electronics/Mobile Phones & Tablets/Smartphones"
  freemium_commission_rate numeric NOT NULL DEFAULT 10.0,
  premium_commission_rate numeric NOT NULL DEFAULT 5.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category_path)
);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'premium')),
  billing_cycle text CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  price_kes numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  auto_renew boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Vendor subscriptions
CREATE TABLE public.vendor_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('freemium', 'premium_weekly', 'premium_monthly', 'premium_yearly', 'pro')),
  monthly_fee_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  auto_renew boolean NOT NULL DEFAULT true,
  subscription_enabled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User notifications table
CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_config
CREATE POLICY "Everyone can view points config" ON public.points_config FOR SELECT USING (true);
CREATE POLICY "Only admins can manage points config" ON public.points_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points record" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update user points" ON public.user_points FOR UPDATE USING (true);

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.points_transactions FOR INSERT WITH CHECK (true);

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their referrals" ON public.user_referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can create referrals" ON public.user_referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- RLS Policies for style_quiz_questions
CREATE POLICY "Everyone can view active quiz questions" ON public.style_quiz_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage quiz questions" ON public.style_quiz_questions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_quiz_responses
CREATE POLICY "Users can view their own quiz responses" ON public.user_quiz_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz responses" ON public.user_quiz_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for vendor_commissions
CREATE POLICY "Everyone can view commission rates" ON public.vendor_commissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage commission rates" ON public.vendor_commissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subscriptions" ON public.user_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user subscriptions" ON public.user_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for vendor_subscriptions
CREATE POLICY "Vendors can view their own subscriptions" ON public.vendor_subscriptions FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can manage their own subscriptions" ON public.vendor_subscriptions FOR ALL USING (auth.uid() = vendor_id);
CREATE POLICY "Admins can view all vendor subscriptions" ON public.vendor_subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- Insert default points configuration
INSERT INTO public.points_config (point_value_kes) VALUES (0.10);

-- Add missing columns to vendor_commissions table
ALTER TABLE public.vendor_commissions 
ADD COLUMN IF NOT EXISTS main_category text,
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS sub_subcategory text,
ADD COLUMN IF NOT EXISTS category_path text;

-- Clear existing data to avoid conflicts
DELETE FROM public.vendor_commissions;

-- Insert comprehensive commission rates for all product categories
INSERT INTO public.vendor_commissions (main_category, subcategory, sub_subcategory, category_path, freemium_commission_rate, premium_commission_rate) VALUES
-- Electronics
('Electronics', 'Mobile Phones & Tablets', 'Smartphones', 'Electronics/Mobile Phones & Tablets/Smartphones', 8.0, 4.0),
('Electronics', 'Mobile Phones & Tablets', 'Tablets', 'Electronics/Mobile Phones & Tablets/Tablets', 8.0, 4.0),
('Electronics', 'Mobile Phones & Tablets', 'Phone Accessories', 'Electronics/Mobile Phones & Tablets/Phone Accessories', 10.0, 5.0),
('Electronics', 'Computers & Laptops', 'Laptops', 'Electronics/Computers & Laptops/Laptops', 7.0, 3.5),
('Electronics', 'Computers & Laptops', 'Desktop Computers', 'Electronics/Computers & Laptops/Desktop Computers', 7.0, 3.5),
('Electronics', 'Computers & Laptops', 'Computer Accessories', 'Electronics/Computers & Laptops/Computer Accessories', 10.0, 5.0),
('Electronics', 'Audio & Video', 'Headphones', 'Electronics/Audio & Video/Headphones', 9.0, 4.5),
('Electronics', 'Audio & Video', 'Speakers', 'Electronics/Audio & Video/Speakers', 9.0, 4.5),
('Electronics', 'Audio & Video', 'TVs & Monitors', 'Electronics/Audio & Video/TVs & Monitors', 6.0, 3.0),
('Electronics', 'Gaming', 'Gaming Consoles', 'Electronics/Gaming/Gaming Consoles', 6.0, 3.0),
('Electronics', 'Gaming', 'Gaming Accessories', 'Electronics/Gaming/Gaming Accessories', 10.0, 5.0),

-- Fashion
('Fashion', 'Men\'s Clothing', 'T-Shirts', 'Fashion/Men\'s Clothing/T-Shirts', 12.0, 6.0),
('Fashion', 'Men\'s Clothing', 'Shirts', 'Fashion/Men\'s Clothing/Shirts', 12.0, 6.0),
('Fashion', 'Men\'s Clothing', 'Jeans', 'Fashion/Men\'s Clothing/Jeans', 11.0, 5.5),
('Fashion', 'Men\'s Clothing', 'Pants', 'Fashion/Men\'s Clothing/Pants', 11.0, 5.5),
('Fashion', 'Men\'s Clothing', 'Jackets', 'Fashion/Men\'s Clothing/Jackets', 10.0, 5.0),
('Fashion', 'Men\'s Clothing', 'Suits', 'Fashion/Men\'s Clothing/Suits', 8.0, 4.0),
('Fashion', 'Women\'s Clothing', 'Dresses', 'Fashion/Women\'s Clothing/Dresses', 12.0, 6.0),
('Fashion', 'Women\'s Clothing', 'Tops', 'Fashion/Women\'s Clothing/Tops', 12.0, 6.0),
('Fashion', 'Women\'s Clothing', 'Skirts', 'Fashion/Women\'s Clothing/Skirts', 12.0, 6.0),
('Fashion', 'Women\'s Clothing', 'Jeans', 'Fashion/Women\'s Clothing/Jeans', 11.0, 5.5),
('Fashion', 'Women\'s Clothing', 'Pants', 'Fashion/Women\'s Clothing/Pants', 11.0, 5.5),
('Fashion', 'Women\'s Clothing', 'Jackets', 'Fashion/Women\'s Clothing/Jackets', 10.0, 5.0),
('Fashion', 'Shoes', 'Men\'s Shoes', 'Fashion/Shoes/Men\'s Shoes', 10.0, 5.0),
('Fashion', 'Shoes', 'Women\'s Shoes', 'Fashion/Shoes/Women\'s Shoes', 10.0, 5.0),
('Fashion', 'Shoes', 'Sports Shoes', 'Fashion/Shoes/Sports Shoes', 9.0, 4.5),
('Fashion', 'Accessories', 'Bags', 'Fashion/Accessories/Bags', 11.0, 5.5),
('Fashion', 'Accessories', 'Watches', 'Fashion/Accessories/Watches', 8.0, 4.0),
('Fashion', 'Accessories', 'Jewelry', 'Fashion/Accessories/Jewelry', 9.0, 4.5),
('Fashion', 'Accessories', 'Belts', 'Fashion/Accessories/Belts', 12.0, 6.0),

-- Home & Garden
('Home & Garden', 'Furniture', 'Living Room', 'Home & Garden/Furniture/Living Room', 8.0, 4.0),
('Home & Garden', 'Furniture', 'Bedroom', 'Home & Garden/Furniture/Bedroom', 8.0, 4.0),
('Home & Garden', 'Furniture', 'Kitchen & Dining', 'Home & Garden/Furniture/Kitchen & Dining', 8.0, 4.0),
('Home & Garden', 'Furniture', 'Office', 'Home & Garden/Furniture/Office', 8.0, 4.0),
('Home & Garden', 'Decor', 'Wall Art', 'Home & Garden/Decor/Wall Art', 11.0, 5.5),
('Home & Garden', 'Decor', 'Cushions & Throws', 'Home & Garden/Decor/Cushions & Throws', 11.0, 5.5),
('Home & Garden', 'Decor', 'Vases & Planters', 'Home & Garden/Decor/Vases & Planters', 11.0, 5.5),
('Home & Garden', 'Kitchen', 'Cookware', 'Home & Garden/Kitchen/Cookware', 9.0, 4.5),
('Home & Garden', 'Kitchen', 'Small Appliances', 'Home & Garden/Kitchen/Small Appliances', 8.0, 4.0),
('Home & Garden', 'Kitchen', 'Kitchen Accessories', 'Home & Garden/Kitchen/Kitchen Accessories', 10.0, 5.0),
('Home & Garden', 'Garden', 'Plants', 'Home & Garden/Garden/Plants', 12.0, 6.0),
('Home & Garden', 'Garden', 'Garden Tools', 'Home & Garden/Garden/Garden Tools', 10.0, 5.0),
('Home & Garden', 'Garden', 'Outdoor Furniture', 'Home & Garden/Garden/Outdoor Furniture', 8.0, 4.0),

-- Sports & Outdoors
('Sports & Outdoors', 'Fitness', 'Gym Equipment', 'Sports & Outdoors/Fitness/Gym Equipment', 7.0, 3.5),
('Sports & Outdoors', 'Fitness', 'Yoga & Pilates', 'Sports & Outdoors/Fitness/Yoga & Pilates', 9.0, 4.5),
('Sports & Outdoors', 'Fitness', 'Running', 'Sports & Outdoors/Fitness/Running', 9.0, 4.5),
('Sports & Outdoors', 'Team Sports', 'Football', 'Sports & Outdoors/Team Sports/Football', 8.0, 4.0),
('Sports & Outdoors', 'Team Sports', 'Basketball', 'Sports & Outdoors/Team Sports/Basketball', 8.0, 4.0),
('Sports & Outdoors', 'Team Sports', 'Cricket', 'Sports & Outdoors/Team Sports/Cricket', 8.0, 4.0),
('Sports & Outdoors', 'Outdoor Activities', 'Camping', 'Sports & Outdoors/Outdoor Activities/Camping', 9.0, 4.5),
('Sports & Outdoors', 'Outdoor Activities', 'Hiking', 'Sports & Outdoors/Outdoor Activities/Hiking', 9.0, 4.5),
('Sports & Outdoors', 'Outdoor Activities', 'Cycling', 'Sports & Outdoors/Outdoor Activities/Cycling', 8.0, 4.0),
('Sports & Outdoors', 'Water Sports', 'Swimming', 'Sports & Outdoors/Water Sports/Swimming', 9.0, 4.5),
('Sports & Outdoors', 'Water Sports', 'Fishing', 'Sports & Outdoors/Water Sports/Fishing', 8.0, 4.0),

-- Beauty & Personal Care
('Beauty & Personal Care', 'Skincare', 'Face Care', 'Beauty & Personal Care/Skincare/Face Care', 10.0, 5.0),
('Beauty & Personal Care', 'Skincare', 'Body Care', 'Beauty & Personal Care/Skincare/Body Care', 10.0, 5.0),
('Beauty & Personal Care', 'Skincare', 'Sun Care', 'Beauty & Personal Care/Skincare/Sun Care', 10.0, 5.0),
('Beauty & Personal Care', 'Makeup', 'Face Makeup', 'Beauty & Personal Care/Makeup/Face Makeup', 11.0, 5.5),
('Beauty & Personal Care', 'Makeup', 'Eye Makeup', 'Beauty & Personal Care/Makeup/Eye Makeup', 11.0, 5.5),
('Beauty & Personal Care', 'Makeup', 'Lip Makeup', 'Beauty & Personal Care/Makeup/Lip Makeup', 11.0, 5.5),
('Beauty & Personal Care', 'Hair Care', 'Shampoo & Conditioner', 'Beauty & Personal Care/Hair Care/Shampoo & Conditioner', 10.0, 5.0),
('Beauty & Personal Care', 'Hair Care', 'Hair Styling', 'Beauty & Personal Care/Hair Care/Hair Styling', 10.0, 5.0),
('Beauty & Personal Care', 'Hair Care', 'Hair Accessories', 'Beauty & Personal Care/Hair Care/Hair Accessories', 12.0, 6.0),
('Beauty & Personal Care', 'Fragrances', 'Men\'s Fragrances', 'Beauty & Personal Care/Fragrances/Men\'s Fragrances', 8.0, 4.0),
('Beauty & Personal Care', 'Fragrances', 'Women\'s Fragrances', 'Beauty & Personal Care/Fragrances/Women\'s Fragrances', 8.0, 4.0),
('Beauty & Personal Care', 'Personal Care', 'Oral Care', 'Beauty & Personal Care/Personal Care/Oral Care', 11.0, 5.5),
('Beauty & Personal Care', 'Personal Care', 'Bath & Body', 'Beauty & Personal Care/Personal Care/Bath & Body', 11.0, 5.5),

-- Books & Media
('Books & Media', 'Books', 'Fiction', 'Books & Media/Books/Fiction', 12.0, 6.0),
('Books & Media', 'Books', 'Non-Fiction', 'Books & Media/Books/Non-Fiction', 12.0, 6.0),
('Books & Media', 'Books', 'Academic', 'Books & Media/Books/Academic', 10.0, 5.0),
('Books & Media', 'Books', 'Children\'s Books', 'Books & Media/Books/Children\'s Books', 12.0, 6.0),
('Books & Media', 'Music', 'CDs', 'Books & Media/Music/CDs', 10.0, 5.0),
('Books & Media', 'Music', 'Vinyl Records', 'Books & Media/Music/Vinyl Records', 8.0, 4.0),
('Books & Media', 'Movies & TV', 'DVDs', 'Books & Media/Movies & TV/DVDs', 10.0, 5.0),
('Books & Media', 'Movies & TV', 'Blu-rays', 'Books & Media/Movies & TV/Blu-rays', 9.0, 4.5),
('Books & Media', 'Gaming', 'Video Games', 'Books & Media/Gaming/Video Games', 7.0, 3.5),
('Books & Media', 'Gaming', 'Board Games', 'Books & Media/Gaming/Board Games', 10.0, 5.0),

-- Toys & Games
('Toys & Games', 'Educational Toys', 'STEM Toys', 'Toys & Games/Educational Toys/STEM Toys', 10.0, 5.0),
('Toys & Games', 'Educational Toys', 'Learning Toys', 'Toys & Games/Educational Toys/Learning Toys', 10.0, 5.0),
('Toys & Games', 'Action Figures', 'Superheroes', 'Toys & Games/Action Figures/Superheroes', 9.0, 4.5),
('Toys & Games', 'Action Figures', 'Anime & Manga', 'Toys & Games/Action Figures/Anime & Manga', 9.0, 4.5),
('Toys & Games', 'Dolls', 'Fashion Dolls', 'Toys & Games/Dolls/Fashion Dolls', 9.0, 4.5),
('Toys & Games', 'Dolls', 'Baby Dolls', 'Toys & Games/Dolls/Baby Dolls', 9.0, 4.5),
('Toys & Games', 'Building Sets', 'LEGO', 'Toys & Games/Building Sets/LEGO', 7.0, 3.5),
('Toys & Games', 'Building Sets', 'Other Building Sets', 'Toys & Games/Building Sets/Other Building Sets', 8.0, 4.0),
('Toys & Games', 'Arts & Crafts', 'Drawing & Painting', 'Toys & Games/Arts & Crafts/Drawing & Painting', 11.0, 5.5),
('Toys & Games', 'Arts & Crafts', 'Craft Kits', 'Toys & Games/Arts & Crafts/Craft Kits', 11.0, 5.5),
('Toys & Games', 'Outdoor Toys', 'Ride-On Toys', 'Toys & Games/Outdoor Toys/Ride-On Toys', 8.0, 4.0),
('Toys & Games', 'Outdoor Toys', 'Play Equipment', 'Toys & Games/Outdoor Toys/Play Equipment', 8.0, 4.0),

-- Automotive
('Automotive', 'Car Parts', 'Engine Parts', 'Automotive/Car Parts/Engine Parts', 6.0, 3.0),
('Automotive', 'Car Parts', 'Brake System', 'Automotive/Car Parts/Brake System', 6.0, 3.0),
('Automotive', 'Car Parts', 'Suspension', 'Automotive/Car Parts/Suspension', 6.0, 3.0),
('Automotive', 'Car Parts', 'Electrical', 'Automotive/Car Parts/Electrical', 7.0, 3.5),
('Automotive', 'Car Accessories', 'Interior', 'Automotive/Car Accessories/Interior', 9.0, 4.5),
('Automotive', 'Car Accessories', 'Exterior', 'Automotive/Car Accessories/Exterior', 9.0, 4.5),
('Automotive', 'Car Accessories', 'Audio & Video', 'Automotive/Car Accessories/Audio & Video', 8.0, 4.0),
('Automotive', 'Motorcycle Parts', 'Engine Parts', 'Automotive/Motorcycle Parts/Engine Parts', 6.0, 3.0),
('Automotive', 'Motorcycle Parts', 'Body Parts', 'Automotive/Motorcycle Parts/Body Parts', 7.0, 3.5),
('Automotive', 'Motorcycle Parts', 'Accessories', 'Automotive/Motorcycle Parts/Accessories', 8.0, 4.0),
('Automotive', 'Tools & Equipment', 'Hand Tools', 'Automotive/Tools & Equipment/Hand Tools', 8.0, 4.0),
('Automotive', 'Tools & Equipment', 'Power Tools', 'Automotive/Tools & Equipment/Power Tools', 7.0, 3.5),
('Automotive', 'Tools & Equipment', 'Diagnostic Tools', 'Automotive/Tools & Equipment/Diagnostic Tools', 6.0, 3.0),

-- Health & Wellness
('Health & Wellness', 'Vitamins & Supplements', 'Multivitamins', 'Health & Wellness/Vitamins & Supplements/Multivitamins', 9.0, 4.5),
('Health & Wellness', 'Vitamins & Supplements', 'Protein Supplements', 'Health & Wellness/Vitamins & Supplements/Protein Supplements', 8.0, 4.0),
('Health & Wellness', 'Vitamins & Supplements', 'Herbal Supplements', 'Health & Wellness/Vitamins & Supplements/Herbal Supplements', 9.0, 4.5),
('Health & Wellness', 'Medical Devices', 'Blood Pressure Monitors', 'Health & Wellness/Medical Devices/Blood Pressure Monitors', 7.0, 3.5),
('Health & Wellness', 'Medical Devices', 'Thermometers', 'Health & Wellness/Medical Devices/Thermometers', 8.0, 4.0),
('Health & Wellness', 'Medical Devices', 'First Aid', 'Health & Wellness/Medical Devices/First Aid', 9.0, 4.5),
('Health & Wellness', 'Fitness Equipment', 'Cardio Equipment', 'Health & Wellness/Fitness Equipment/Cardio Equipment', 7.0, 3.5),
('Health & Wellness', 'Fitness Equipment', 'Strength Training', 'Health & Wellness/Fitness Equipment/Strength Training', 7.0, 3.5),
('Health & Wellness', 'Fitness Equipment', 'Yoga Equipment', 'Health & Wellness/Fitness Equipment/Yoga Equipment', 9.0, 4.5),
('Health & Wellness', 'Personal Care', 'Hair Removal', 'Health & Wellness/Personal Care/Hair Removal', 10.0, 5.0),
('Health & Wellness', 'Personal Care', 'Oral Care', 'Health & Wellness/Personal Care/Oral Care', 10.0, 5.0),
('Health & Wellness', 'Personal Care', 'Skin Care', 'Health & Wellness/Personal Care/Skin Care', 10.0, 5.0),

-- Baby & Kids
('Baby & Kids', 'Baby Clothing', 'Newborn (0-3 months)', 'Baby & Kids/Baby Clothing/Newborn (0-3 months)', 11.0, 5.5),
('Baby & Kids', 'Baby Clothing', '3-6 months', 'Baby & Kids/Baby Clothing/3-6 months', 11.0, 5.5),
('Baby & Kids', 'Baby Clothing', '6-12 months', 'Baby & Kids/Baby Clothing/6-12 months', 11.0, 5.5),
('Baby & Kids', 'Baby Clothing', '12-24 months', 'Baby & Kids/Baby Clothing/12-24 months', 11.0, 5.5),
('Baby & Kids', 'Kids Clothing', 'Boys (2-8 years)', 'Baby & Kids/Kids Clothing/Boys (2-8 years)', 11.0, 5.5),
('Baby & Kids', 'Kids Clothing', 'Girls (2-8 years)', 'Baby & Kids/Kids Clothing/Girls (2-8 years)', 11.0, 5.5),
('Baby & Kids', 'Kids Clothing', 'Boys (8-16 years)', 'Baby & Kids/Kids Clothing/Boys (8-16 years)', 11.0, 5.5),
('Baby & Kids', 'Kids Clothing', 'Girls (8-16 years)', 'Baby & Kids/Kids Clothing/Girls (8-16 years)', 11.0, 5.5),
('Baby & Kids', 'Baby Care', 'Diapers & Wipes', 'Baby & Kids/Baby Care/Diapers & Wipes', 8.0, 4.0),
('Baby & Kids', 'Baby Care', 'Baby Food', 'Baby & Kids/Baby Care/Baby Food', 8.0, 4.0),
('Baby & Kids', 'Baby Care', 'Baby Bath & Skincare', 'Baby & Kids/Baby Care/Baby Bath & Skincare', 9.0, 4.5),
('Baby & Kids', 'Baby Gear', 'Strollers', 'Baby & Kids/Baby Gear/Strollers', 6.0, 3.0),
('Baby & Kids', 'Baby Gear', 'Car Seats', 'Baby & Kids/Baby Gear/Car Seats', 6.0, 3.0),
('Baby & Kids', 'Baby Gear', 'High Chairs', 'Baby & Kids/Baby Gear/High Chairs', 7.0, 3.5),
('Baby & Kids', 'Toys', 'Baby Toys', 'Baby & Kids/Toys/Baby Toys', 10.0, 5.0),
('Baby & Kids', 'Toys', 'Educational Toys', 'Baby & Kids/Toys/Educational Toys', 10.0, 5.0),
('Baby & Kids', 'Toys', 'Outdoor Toys', 'Baby & Kids/Toys/Outdoor Toys', 9.0, 4.5),

-- Pet Supplies
('Pet Supplies', 'Dogs', 'Food', 'Pet Supplies/Dogs/Food', 8.0, 4.0),
('Pet Supplies', 'Dogs', 'Toys', 'Pet Supplies/Dogs/Toys', 10.0, 5.0),
('Pet Supplies', 'Dogs', 'Grooming', 'Pet Supplies/Dogs/Grooming', 9.0, 4.5),
('Pet Supplies', 'Dogs', 'Health & Care', 'Pet Supplies/Dogs/Health & Care', 8.0, 4.0),
('Pet Supplies', 'Cats', 'Food', 'Pet Supplies/Cats/Food', 8.0, 4.0),
('Pet Supplies', 'Cats', 'Toys', 'Pet Supplies/Cats/Toys', 10.0, 5.0),
('Pet Supplies', 'Cats', 'Grooming', 'Pet Supplies/Cats/Grooming', 9.0, 4.5),
('Pet Supplies', 'Cats', 'Health & Care', 'Pet Supplies/Cats/Health & Care', 8.0, 4.0),
('Pet Supplies', 'Other Pets', 'Birds', 'Pet Supplies/Other Pets/Birds', 9.0, 4.5),
('Pet Supplies', 'Other Pets', 'Fish', 'Pet Supplies/Other Pets/Fish', 9.0, 4.5),
('Pet Supplies', 'Other Pets', 'Small Animals', 'Pet Supplies/Other Pets/Small Animals', 9.0, 4.5),
('Pet Supplies', 'Pet Accessories', 'Beds & Furniture', 'Pet Supplies/Pet Accessories/Beds & Furniture', 8.0, 4.0),
('Pet Supplies', 'Pet Accessories', 'Collars & Leashes', 'Pet Supplies/Pet Accessories/Collars & Leashes', 9.0, 4.5),
('Pet Supplies', 'Pet Accessories', 'Carriers & Travel', 'Pet Supplies/Pet Accessories/Carriers & Travel', 8.0, 4.0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_category_path ON public.vendor_commissions(category_path);
CREATE INDEX IF NOT EXISTS idx_vendor_commissions_main_category ON public.vendor_commissions(main_category);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.user_notifications 
  SET is_read = true, updated_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.user_notifications 
  SET is_read = true, updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Function to enable vendor subscriptions
CREATE OR REPLACE FUNCTION public.enable_vendor_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.points_config (vendor_subscription_enabled)
  VALUES (true);
END;
$$;

-- Function to disable vendor subscriptions
CREATE OR REPLACE FUNCTION public.disable_vendor_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.points_config (vendor_subscription_enabled)
  VALUES (false);
END;
$$;

-- Function to enable customer premium plans
CREATE OR REPLACE FUNCTION public.enable_customer_premium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.points_config (customer_premium_enabled)
  VALUES (true);
END;
$$;

-- Function to disable customer premium plans
CREATE OR REPLACE FUNCTION public.disable_customer_premium()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.points_config (customer_premium_enabled)
  VALUES (false);
END;
$$;

-- Function to get commission rate for a vendor and category
CREATE OR REPLACE FUNCTION public.get_vendor_commission_rate(vendor_id_param uuid, category_path_param text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  vendor_plan text;
  commission_rate numeric;
BEGIN
  -- Get vendor's subscription plan
  SELECT plan_type INTO vendor_plan
  FROM public.vendor_subscriptions
  WHERE vendor_id = vendor_id_param 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to freemium if no active subscription
  IF vendor_plan IS NULL THEN
    vendor_plan := 'freemium';
  END IF;
  
  -- Get commission rate based on plan and category
  IF vendor_plan = 'premium' THEN
    SELECT premium_commission_rate INTO commission_rate
    FROM public.vendor_commissions
    WHERE category_path = category_path_param
      AND is_active = true
    LIMIT 1;
  ELSE
    SELECT freemium_commission_rate INTO commission_rate
    FROM public.vendor_commissions
    WHERE category_path = category_path_param
      AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Return default rate if no specific rate found
  IF commission_rate IS NULL THEN
    IF vendor_plan = 'premium' THEN
      commission_rate := 5.0;
    ELSE
      commission_rate := 10.0;
    END IF;
  END IF;
  
  RETURN commission_rate;
END;
$$;