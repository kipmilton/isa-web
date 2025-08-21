-- Update approve_product function to create notification
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
  vendor_id uuid;
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

  -- Get vendor_id from the product
  SELECT vendor_id INTO vendor_id FROM public.products WHERE id = product_id;

  -- Update product status
  UPDATE public.products 
  SET status = 'approved',
      rejection_reason = NULL,
      is_active = true
  WHERE id = product_id;

  -- Create notification for vendor
  INSERT INTO public.notifications (product_id, vendor_id, type, message)
  VALUES (product_id, vendor_id, 'product_approved', 'Your product has been approved and is now live!');

  RETURN TRUE;
END;
$function$;
