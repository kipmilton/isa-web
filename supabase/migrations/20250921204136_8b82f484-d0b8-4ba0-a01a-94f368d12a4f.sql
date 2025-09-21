-- Create app_sounds table for managing application sound effects
CREATE TABLE public.app_sounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  url TEXT NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 0.7 CHECK (volume >= 0 AND volume <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_sounds ENABLE ROW LEVEL SECURITY;

-- Create policies for app_sounds
CREATE POLICY "Everyone can view sound settings" 
ON public.app_sounds 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage sound settings" 
ON public.app_sounds 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create storage bucket for app sounds if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-sounds', 'app-sounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for app sounds
CREATE POLICY "Admins can upload sound files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-sounds' 
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Everyone can view sound files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-sounds');

-- Create trigger for updated_at
CREATE TRIGGER update_app_sounds_updated_at
  BEFORE UPDATE ON public.app_sounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sound settings
INSERT INTO public.app_sounds (event_key, enabled, url, volume) VALUES
('add_to_cart', true, '/sounds/click.mp3', 0.6),
('like_toggle', true, '/sounds/like.mp3', 0.7),
('checkout_open', true, '/sounds/open.mp3', 0.5),
('checkout_success', true, '/sounds/success.mp3', 0.8),
('submit_review', true, '/sounds/success.mp3', 0.8),
('open_reviews', true, '/sounds/open.mp3', 0.5)
ON CONFLICT (event_key) DO NOTHING;