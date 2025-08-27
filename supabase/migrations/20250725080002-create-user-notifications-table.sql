-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('general', 'loyalty', 'order', 'delivery', 'payment')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for better performance
  INDEX idx_user_notifications_user_id (user_id),
  INDEX idx_user_notifications_is_read (is_read),
  INDEX idx_user_notifications_created_at (created_at)
);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications for users" ON user_notifications
  FOR INSERT WITH CHECK (true);
