-- Fix the remaining 3 functions with search path issues

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_vendor_applications_with_emails()
RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone_number text, company text, business_type text, status text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    u.email,
    p.phone_number,
    p.company,
    p.business_type,
    p.status,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.user_type = 'vendor'
  ORDER BY p.created_at DESC;
END;
$function$;