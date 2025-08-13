-- Add foreign key constraints that are missing

-- Add foreign key for vendor_application_steps to profiles
ALTER TABLE public.vendor_application_steps 
ADD CONSTRAINT vendor_application_steps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key for admin_roles to profiles  
ALTER TABLE public.admin_roles 
ADD CONSTRAINT admin_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key for admin_roles assigned_by to profiles
ALTER TABLE public.admin_roles 
ADD CONSTRAINT admin_roles_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;