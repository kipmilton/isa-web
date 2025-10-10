-- Enhanced role-based admin system with multiple admin types

-- First, drop existing constraints and policies that might conflict
DROP POLICY IF EXISTS "Main admins can manage all admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;

-- Update admin_roles table structure
ALTER TABLE public.admin_roles 
DROP COLUMN IF EXISTS assigned_by,
DROP COLUMN IF EXISTS assigned_at,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS must_reset_password boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_role ON public.admin_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(is_active, is_suspended);

-- Create vendor_guidelines table for downloadable onboarding materials
CREATE TABLE IF NOT EXISTS public.vendor_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  version text DEFAULT '1.0',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on vendor_guidelines
ALTER TABLE public.vendor_guidelines ENABLE ROW LEVEL SECURITY;

-- Vendors can view active guidelines
CREATE POLICY "Vendors can view active guidelines"
ON public.vendor_guidelines
FOR SELECT
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'vendor'
  )
);

-- Main admins can manage guidelines
CREATE POLICY "Main admins can manage guidelines"
ON public.vendor_guidelines
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
    AND ar.is_suspended = false
  )
);

-- Update admin_roles RLS policies with new role types and suspension checks
CREATE POLICY "Main admins can manage all admin roles"
ON public.admin_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role = 'main_admin'
    AND ar.is_active = true
    AND ar.is_suspended = false
  )
);

CREATE POLICY "Admins can view their own role"
ON public.admin_roles
FOR SELECT
USING (user_id = auth.uid());

-- Function to check admin access with suspension check
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
    AND is_suspended = false
    AND (_required_role IS NULL OR role = _required_role);
  
  RETURN FOUND;
END;
$$;

-- Function to create admin user with default password
CREATE OR REPLACE FUNCTION public.create_admin_user(
  _email text,
  _role text,
  _created_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _password text := 'Recipe@2025';
  result jsonb;
BEGIN
  -- Check if creator is main admin
  IF NOT public.check_admin_access(_created_by, 'main_admin') THEN
    RAISE EXCEPTION 'Only main admins can create admin users';
  END IF;

  -- Check if user exists
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email;

  IF _user_id IS NULL THEN
    -- Create new user in auth.users via API
    RAISE EXCEPTION 'User creation must be done via Supabase Auth API';
  END IF;

  -- Insert admin role
  INSERT INTO public.admin_roles (user_id, role, created_by, must_reset_password)
  VALUES (_user_id, _role, _created_by, true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = true,
    is_suspended = false,
    must_reset_password = true,
    updated_at = now();

  result := jsonb_build_object(
    'success', true,
    'user_id', _user_id,
    'default_password', _password
  );

  RETURN result;
END;
$$;

-- Function to suspend/unsuspend admin
CREATE OR REPLACE FUNCTION public.toggle_admin_suspension(
  _user_id uuid,
  _suspend boolean,
  _suspended_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user performing action is main admin
  IF NOT public.check_admin_access(_suspended_by, 'main_admin') THEN
    RAISE EXCEPTION 'Only main admins can suspend/unsuspend admins';
  END IF;

  -- Cannot suspend main admin
  IF EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _user_id AND role = 'main_admin'
  ) THEN
    RAISE EXCEPTION 'Cannot suspend main admin';
  END IF;

  UPDATE public.admin_roles
  SET 
    is_suspended = _suspend,
    suspended_at = CASE WHEN _suspend THEN now() ELSE NULL END,
    suspended_by = CASE WHEN _suspend THEN _suspended_by ELSE NULL END,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;

-- Function to reset admin password
CREATE OR REPLACE FUNCTION public.reset_admin_password(
  _user_id uuid,
  _current_password text,
  _new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify current password (this is a placeholder - actual password verification should be done via Supabase Auth)
  -- In production, use Supabase Auth's password update functionality
  
  -- Update must_reset_password flag
  UPDATE public.admin_roles
  SET 
    must_reset_password = false,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;

-- Update existing RLS policies on other tables to check for suspension
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
USING (public.check_admin_access(auth.uid()));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_admin_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_admin_suspension TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_admin_password TO authenticated;