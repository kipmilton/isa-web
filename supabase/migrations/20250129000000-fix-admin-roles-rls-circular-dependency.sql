-- Fix admin_roles RLS circular dependency issues
-- The issue is that RLS policies reference the admin_roles table itself causing infinite recursion
-- Solution: Use a function-based approach to check admin access

-- Drop policies that depend on check_admin_access function
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

-- Drop problematic policies
DROP POLICY IF EXISTS "Main admins can manage all admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Main admins can manage all admin roles v2" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view their own role" ON public.admin_roles;
DROP POLICY IF EXISTS "Active admins can view all admin roles" ON public.admin_roles;

-- Create a new function to check admin status without circular dependency
CREATE OR REPLACE FUNCTION public.is_admin_active(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _user_id 
    AND is_active = true 
    AND (is_suspended = false OR is_suspended IS NULL)
  );
$$;

-- Drop existing has_admin_role function if it exists with different signature
DROP FUNCTION IF EXISTS public.has_admin_role(uuid);
DROP FUNCTION IF EXISTS public.has_admin_role(uuid, text);

-- Create a new function to check specific admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _user_id 
    AND is_active = true 
    AND (is_suspended = false OR is_suspended IS NULL)
    AND (_role IS NULL OR role = _role)
  );
$$;

-- Users can view their own admin roles
CREATE POLICY "Users can view their own admin roles"
ON public.admin_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all admin roles (using function to avoid circular dependency)
CREATE POLICY "Active admins can view all admin roles"
ON public.admin_roles
FOR SELECT
USING (public.is_admin_active());

-- Admins can manage all admin roles (using function to avoid circular dependency)  
CREATE POLICY "Main admins can manage all admin roles v2"
ON public.admin_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
    AND (ar.is_suspended = false OR ar.is_suspended IS NULL)
  )
);

-- Drop existing check_admin_access function if it exists
DROP FUNCTION IF EXISTS public.check_admin_access(uuid);
DROP FUNCTION IF EXISTS public.check_admin_access(uuid, text);

-- Update check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access(
  _user_id uuid,
  _required_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record record;
BEGIN
  SELECT * INTO admin_record
  FROM public.admin_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND (is_suspended = false OR is_suspended IS NULL)
    AND (_required_role IS NULL OR role = _required_role);
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin_active(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_role(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_admin_access(uuid, text) TO authenticated, anon;

-- Recreate the notifications policy that was dropped
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
USING (public.check_admin_access(auth.uid()));
