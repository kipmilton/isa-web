-- Fix admin access issues for training modules and admin functions
-- This ensures that main admins can access all admin functions properly

-- First, let's make sure the main admins exist
INSERT INTO public.admin_roles (user_id, role) 
SELECT id, 'main_admin' 
FROM auth.users 
WHERE email IN ('kipmilton71@gmail.com', 'isashoppingai@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM public.admin_roles ar 
  WHERE ar.user_id = auth.users.id AND ar.role = 'main_admin'
);

-- Update training_modules policies to allow main admins full access
DROP POLICY IF EXISTS "Main admins can manage training modules" ON public.training_modules;
CREATE POLICY "Main admins can manage training modules"
ON public.training_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
  )
);

-- Also allow main admins to view all training modules regardless of is_active status
CREATE POLICY "Main admins can view all training modules"
ON public.training_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
  )
);

-- Update admin_roles policies to ensure main admins can manage all roles
DROP POLICY IF EXISTS "Main admins can manage all admin roles" ON public.admin_roles;
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

-- Update support_requests policies
DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;
CREATE POLICY "Admins can view all support requests"
ON public.support_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
  )
);

-- Update vendor_application_steps policies
DROP POLICY IF EXISTS "Admins can view all application steps" ON public.vendor_application_steps;
CREATE POLICY "Admins can view all application steps"
ON public.vendor_application_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role IN ('main_admin', 'vendor_approver')
    AND ar.is_active = true
  )
);

-- Create a function to check if user is main admin
CREATE OR REPLACE FUNCTION public.is_main_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _user_id 
    AND role = 'main_admin' 
    AND is_active = true
  );
$function$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.training_modules TO authenticated;
GRANT ALL ON public.admin_roles TO authenticated;
GRANT ALL ON public.support_requests TO authenticated;
GRANT ALL ON public.vendor_application_steps TO authenticated;
GRANT ALL ON public.user_training_progress TO authenticated;
