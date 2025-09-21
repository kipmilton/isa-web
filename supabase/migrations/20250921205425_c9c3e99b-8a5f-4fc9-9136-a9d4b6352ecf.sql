-- Enable RLS on admin_roles table
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_roles table
CREATE POLICY "Main admins can manage all admin roles"
ON public.admin_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
  )
);

CREATE POLICY "Users can view their own admin role"
ON public.admin_roles
FOR SELECT
USING (user_id = auth.uid());

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications table
CREATE POLICY "Vendors can view their own notifications"
ON public.notifications
FOR SELECT
USING (vendor_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
  )
);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);