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

-- Vendor commission rates per category
CREATE TABLE public.vendor_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  freemium_commission_rate numeric NOT NULL DEFAULT 10.0,
  premium_commission_rate numeric NOT NULL DEFAULT 5.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category)
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
  plan_type text NOT NULL CHECK (plan_type IN ('freemium', 'premium')),
  monthly_fee_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  auto_renew boolean NOT NULL DEFAULT true,
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

-- Insert default points configuration
INSERT INTO public.points_config (point_value_kes) VALUES (0.10);

-- Insert default commission rates
INSERT INTO public.vendor_commissions (category, freemium_commission_rate, premium_commission_rate) VALUES
('fashion', 10.0, 5.0),
('lifestyle', 10.0, 5.0),
('home', 10.0, 5.0),
('beverages', 5.0, 2.0),
('wellness', 5.0, 2.0),
('essentials', 5.0, 2.0);

-- Insert default style quiz questions for males
INSERT INTO public.style_quiz_questions (gender, question_text, question_order, options) VALUES
('male', 'What is your preferred clothing style?', 1, '[
  {"text": "Casual & Comfortable", "value": "casual"},
  {"text": "Formal & Professional", "value": "formal"},
  {"text": "Trendy & Fashion-forward", "value": "trendy"},
  {"text": "Classic & Timeless", "value": "classic"}
]'),
('male', 'What type of footwear do you prefer?', 2, '[
  {"text": "Sneakers", "value": "sneakers"},
  {"text": "Dress shoes", "value": "dress_shoes"},
  {"text": "Boots", "value": "boots"},
  {"text": "Sandals", "value": "sandals"}
]'),
('male', 'What is your favorite color palette?', 3, '[
  {"text": "Neutral tones (black, white, gray)", "value": "neutral"},
  {"text": "Earth tones (brown, beige, olive)", "value": "earth"},
  {"text": "Bold colors (red, blue, green)", "value": "bold"},
  {"text": "Pastels (light blue, pink, yellow)", "value": "pastels"}
]'),
('male', 'What occasions do you shop for most?', 4, '[
  {"text": "Work/Professional", "value": "work"},
  {"text": "Casual everyday", "value": "casual"},
  {"text": "Special events", "value": "events"},
  {"text": "Sports/Fitness", "value": "sports"}
]'),
('male', 'What is your preferred shopping budget range?', 5, '[
  {"text": "Under KES 2,000", "value": "budget"},
  {"text": "KES 2,000 - 5,000", "value": "mid"},
  {"text": "KES 5,000 - 10,000", "value": "high"},
  {"text": "Above KES 10,000", "value": "luxury"}
]');

-- Insert default style quiz questions for females
INSERT INTO public.style_quiz_questions (gender, question_text, question_order, options) VALUES
('female', 'What is your preferred fashion style?', 1, '[
  {"text": "Boho & Free-spirited", "value": "boho"},
  {"text": "Minimalist & Clean", "value": "minimalist"},
  {"text": "Glamorous & Elegant", "value": "glamorous"},
  {"text": "Edgy & Bold", "value": "edgy"}
]'),
('female', 'What type of dresses do you prefer?', 2, '[
  {"text": "Maxi dresses", "value": "maxi"},
  {"text": "Mini dresses", "value": "mini"},
  {"text": "Midi dresses", "value": "midi"},
  {"text": "I don''t wear dresses", "value": "none"}
]'),
('female', 'What is your go-to accessory?', 3, '[
  {"text": "Statement jewelry", "value": "jewelry"},
  {"text": "Handbags", "value": "bags"},
  {"text": "Scarves", "value": "scarves"},
  {"text": "Sunglasses", "value": "sunglasses"}
]'),
('female', 'What occasions do you shop for most?', 4, '[
  {"text": "Work/Professional", "value": "work"},
  {"text": "Date nights", "value": "date"},
  {"text": "Casual everyday", "value": "casual"},
  {"text": "Special events", "value": "events"}
]'),
('female', 'What is your preferred shopping budget range?', 5, '[
  {"text": "Under KES 3,000", "value": "budget"},
  {"text": "KES 3,000 - 8,000", "value": "mid"},
  {"text": "KES 8,000 - 15,000", "value": "high"},
  {"text": "Above KES 15,000", "value": "luxury"}
]');

-- Create triggers for updated_at columns
CREATE TRIGGER update_points_config_updated_at BEFORE UPDATE ON public.points_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_style_quiz_questions_updated_at BEFORE UPDATE ON public.style_quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_commissions_updated_at BEFORE UPDATE ON public.vendor_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_subscriptions_updated_at BEFORE UPDATE ON public.vendor_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to award points for spending
CREATE OR REPLACE FUNCTION public.award_spending_points(user_id_param uuid, amount_spent numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  config_row record;
  points_to_award integer;
  expiry_date timestamp with time zone;
BEGIN
  -- Get current points configuration
  SELECT * INTO config_row FROM public.points_config ORDER BY created_at DESC LIMIT 1;
  
  -- Calculate points (10 points per 100 KES spent)
  points_to_award := FLOOR(amount_spent / 100) * config_row.spending_points_per_100_kes;
  
  IF points_to_award > 0 THEN
    -- Set expiry date
    expiry_date := now() + INTERVAL '1 year' * config_row.points_expiry_months / 12;
    
    -- Insert transaction record
    INSERT INTO public.points_transactions (user_id, transaction_type, points, reason, expires_at)
    VALUES (user_id_param, 'earned', points_to_award, 'Purchase spending', expiry_date);
    
    -- Update user points balance
    INSERT INTO public.user_points (user_id, total_points, available_points, lifetime_earned)
    VALUES (user_id_param, points_to_award, points_to_award, points_to_award)
    ON CONFLICT (user_id) DO UPDATE SET
      total_points = user_points.total_points + points_to_award,
      available_points = user_points.available_points + points_to_award,
      lifetime_earned = user_points.lifetime_earned + points_to_award,
      updated_at = now();
  END IF;
END;
$$;

-- Function to redeem points
CREATE OR REPLACE FUNCTION public.redeem_points(user_id_param uuid, points_to_redeem integer, order_id_param uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_balance record;
BEGIN
  -- Get user's current points balance
  SELECT * INTO user_balance FROM public.user_points WHERE user_id = user_id_param;
  
  -- Check if user has enough points
  IF user_balance.available_points < points_to_redeem THEN
    RETURN false;
  END IF;
  
  -- Record redemption transaction
  INSERT INTO public.points_transactions (user_id, transaction_type, points, reason, order_id)
  VALUES (user_id_param, 'redeemed', -points_to_redeem, 'Points redemption', order_id_param);
  
  -- Update user points balance
  UPDATE public.user_points
  SET 
    available_points = available_points - points_to_redeem,
    lifetime_redeemed = lifetime_redeemed + points_to_redeem,
    updated_at = now()
  WHERE user_id = user_id_param;
  
  RETURN true;
END;
$$;