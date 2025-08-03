-- Critical Security Fixes

-- 1. Enable RLS on withdrawals table and create policies
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Vendors can only view and create their own withdrawals
CREATE POLICY "Vendors can view their own withdrawals" 
ON public.withdrawals 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create their own withdrawals" 
ON public.withdrawals 
FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

-- Admins can view all withdrawals for management
CREATE POLICY "Admins can view all withdrawals" 
ON public.withdrawals 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawal status" 
ON public.withdrawals 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix database function security by adding SET search_path = ''

-- Update existing functions to be secure
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(distance_km numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  RETURN GREATEST(distance_km * 40, 100); -- Minimum 100 KES delivery fee
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Update product rating calculation logic here if needed
  RETURN NEW;
END;
$function$;

-- 3. Create consistent admin role checking function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$function$;