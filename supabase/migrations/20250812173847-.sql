-- Create admin roles table
CREATE TABLE public.admin_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('main_admin', 'vendor_approver', 'product_approver')),
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can view their own admin roles"
ON public.admin_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create vendor application steps table
CREATE TABLE public.vendor_application_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  step_name text NOT NULL,
  step_data jsonb DEFAULT '{}',
  completed_at timestamp with time zone,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_application_steps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own application steps"
ON public.vendor_application_steps
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all application steps"
ON public.vendor_application_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid() 
    AND ar.role IN ('main_admin', 'vendor_approver')
    AND ar.is_active = true
  )
);

-- Create training modules table
CREATE TABLE public.training_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text,
  content text,
  module_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active training modules"
ON public.training_modules
FOR SELECT
USING (is_active = true);

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

-- Create user training progress table
CREATE TABLE public.user_training_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.training_modules(id),
  completed_at timestamp with time zone,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own training progress"
ON public.user_training_progress
FOR ALL
USING (auth.uid() = user_id);

-- Create support requests table
CREATE TABLE public.support_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  request_type text NOT NULL DEFAULT 'training_help',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own support requests"
ON public.support_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own support requests"
ON public.support_requests
FOR SELECT
USING (auth.uid() = user_id);

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

-- Insert default training modules
INSERT INTO public.training_modules (title, description, module_order) VALUES
('How to use Seller Center', 'Learn to navigate and use the vendor dashboard effectively', 1),
('How to create product listings', 'Step-by-step guide to creating compelling product listings', 2),
('Order management', 'Understanding how to manage orders from start to finish', 3),
('Packaging and delivery procedures', 'Best practices for packaging and delivery', 4),
('Customer service expectations', 'Guidelines for providing excellent customer service', 5);

-- Insert main admins
INSERT INTO public.admin_roles (user_id, role) 
SELECT id, 'main_admin' 
FROM auth.users 
WHERE email IN ('kipmilton71@gmail.com', 'isashoppingai@gmail.com')
ON CONFLICT DO NOTHING;

-- Create function to check admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _user_id 
    AND role = _role 
    AND is_active = true
  );
$function$;

-- Create triggers for updated_at
CREATE TRIGGER update_admin_roles_updated_at
BEFORE UPDATE ON public.admin_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_application_steps_updated_at
BEFORE UPDATE ON public.vendor_application_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_modules_updated_at
BEFORE UPDATE ON public.training_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();