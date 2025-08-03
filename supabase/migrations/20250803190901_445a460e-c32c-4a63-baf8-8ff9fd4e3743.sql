-- Fix remaining function security warnings

CREATE OR REPLACE FUNCTION public.approve_vendor_application(application_id uuid, admin_notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Update profile status
  UPDATE public.profiles 
  SET status = 'approved', admin_notes = COALESCE(approve_vendor_application.admin_notes, profiles.admin_notes)
  WHERE id = application_id AND user_type = 'vendor';
  
  -- Add vendor role
  INSERT INTO public.user_roles (user_id, role, assigned_by) 
  VALUES (application_id, 'vendor', auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_vendor_application(application_id uuid, admin_notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Update profile status
  UPDATE public.profiles 
  SET status = 'rejected', admin_notes = COALESCE(reject_vendor_application.admin_notes, profiles.admin_notes)
  WHERE id = application_id AND user_type = 'vendor';
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, first_name, last_name, date_of_birth, gender, location,
    phone_number, avatar_url, company, business_type, user_type,
    status, email
  ) VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    CASE 
      WHEN new.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'date_of_birth')::date
      ELSE NULL
    END,
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'location',
    new.raw_user_meta_data ->> 'phone_number',
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'company',
    new.raw_user_meta_data ->> 'business_type',
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'customer'),
    CASE 
      WHEN new.raw_user_meta_data ->> 'user_type' IN ('vendor', 'delivery') THEN 'pending'
      ELSE 'approved'
    END,
    new.email
  );
  
  -- Assign default customer role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (new.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYMMDD format
  order_num := 'OR' || TO_CHAR(CURRENT_DATE, 'YYMMDD');
  
  -- Get count of orders for today
  SELECT COALESCE(COUNT(*), 0) + 1 INTO counter
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Pad counter with zeros to make it 4 digits
  order_num := order_num || LPAD(counter::TEXT, 4, '0');
  
  RETURN order_num;
END;
$function$;