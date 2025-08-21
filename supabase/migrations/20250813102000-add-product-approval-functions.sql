-- Migration: Add product approval functions
-- Approve product function
CREATE OR REPLACE FUNCTION public.approve_product(product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Restrict to main_admin or product_approver
  IF NOT (public.has_admin_role(auth.uid(), 'main_admin') OR public.has_admin_role(auth.uid(), 'product_approver')) THEN
    RAISE EXCEPTION 'Access denied: main_admin or product_approver role required';
  END IF;

  UPDATE public.products 
  SET status = 'approved',
      rejection_reason = NULL,
      is_active = true
  WHERE id = product_id;

  RETURN TRUE;
END;
$function$;

-- Reject product function
CREATE OR REPLACE FUNCTION public.reject_product(product_id uuid, reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Restrict to main_admin or product_approver
  IF NOT (public.has_admin_role(auth.uid(), 'main_admin') OR public.has_admin_role(auth.uid(), 'product_approver')) THEN
    RAISE EXCEPTION 'Access denied: main_admin or product_approver role required';
  END IF;

  UPDATE public.products 
  SET status = 'rejected',
      rejection_reason = reason,
      is_active = false
  WHERE id = product_id;

  RETURN TRUE;
END;
$function$;
