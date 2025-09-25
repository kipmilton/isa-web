-- Fix the support_tickets relationship with profiles table
ALTER TABLE public.support_tickets 
ADD CONSTRAINT support_tickets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Insert default notification sounds into app_sounds table
INSERT INTO public.app_sounds (event_key, enabled, url, volume) VALUES
('add_to_cart', true, '/sounds/default-notification.wav', 0.4),
('like_toggle', true, '/sounds/default-notification.wav', 0.5),
('checkout_open', true, '/sounds/default-notification.wav', 0.5),
('checkout_success', true, '/sounds/default-notification.wav', 0.65),
('submit_review', true, '/sounds/default-notification.wav', 0.7),
('open_reviews', true, '/sounds/default-notification.wav', 0.5),
('ticket_created', true, '/sounds/default-notification.wav', 0.6),
('ticket_responded', true, '/sounds/default-notification.wav', 0.6)
ON CONFLICT (event_key) DO UPDATE SET
url = EXCLUDED.url,
updated_at = now();