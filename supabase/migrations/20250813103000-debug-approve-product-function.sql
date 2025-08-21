-- Debug version of approve_product function
CREATE OR REPLACE FUNCTION public.approve_product(product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_id uuid;
  has_main_admin boolean;
  has_product_approver boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check admin roles
  has_main_admin := public.has_admin_role(current_user_id, 'main_admin');
  has_product_approver := public.has_admin_role(current_user_id, 'product_approver');
  
  -- Log debug info (this will appear in Supabase logs)
  RAISE NOTICE 'Debug: current_user_id=%, has_main_admin=%, has_product_approver=%', 
    current_user_id, has_main_admin, has_product_approver;
  
  -- Restrict to main_admin or product_approver
  IF NOT (has_main_admin OR has_product_approver) THEN
    RAISE EXCEPTION 'Access denied: main_admin or product_approver role required. User: %, Main Admin: %, Product Approver: %', 
      current_user_id, has_main_admin, has_product_approver;
  END IF;

  UPDATE public.products 
  SET status = 'approved',
      rejection_reason = NULL,
      is_active = true
  WHERE id = product_id;

  RETURN TRUE;
END;
$function$;
