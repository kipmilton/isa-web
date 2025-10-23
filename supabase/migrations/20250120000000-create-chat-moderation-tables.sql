-- Create moderation_logs table for tracking moderated messages
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  original_message TEXT NOT NULL,
  moderated_message TEXT NOT NULL,
  violations TEXT[] NOT NULL DEFAULT '{}',
  action_taken TEXT NOT NULL CHECK (action_taken IN ('blocked', 'masked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_violations table for tracking user violations
CREATE TABLE IF NOT EXISTS public.user_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  violation_count INTEGER NOT NULL DEFAULT 1,
  last_violation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, violation_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON public.moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_order_id ON public.moderation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_violations_user_id ON public.user_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_violations_is_suspended ON public.user_violations(is_suspended);
CREATE INDEX IF NOT EXISTS idx_user_violations_last_violation ON public.user_violations(last_violation DESC);

-- Enable Row Level Security
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_logs
-- Only admins can view moderation logs
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'order_admin', 'customer_support')
    AND is_active = true
  )
);

-- System can insert moderation logs (for service accounts)
CREATE POLICY "System can insert moderation logs"
ON public.moderation_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies for user_violations
-- Users can view their own violations
CREATE POLICY "Users can view their own violations"
ON public.user_violations FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all violations
CREATE POLICY "Admins can view all violations"
ON public.user_violations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'order_admin', 'customer_support')
    AND is_active = true
  )
);

-- System can insert and update violations
CREATE POLICY "System can manage violations"
ON public.user_violations FOR ALL
USING (true);

-- Create trigger for automatic timestamp updates on user_violations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_violations_updated_at
    BEFORE UPDATE ON public.user_violations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add a function to check if user is suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_violations 
        WHERE user_id = user_uuid AND is_suspended = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to get user violation count
CREATE OR REPLACE FUNCTION public.get_user_violation_count(user_uuid UUID, violation_type_param TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE((
        SELECT violation_count 
        FROM public.user_violations 
        WHERE user_id = user_uuid AND violation_type = violation_type_param
    ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
