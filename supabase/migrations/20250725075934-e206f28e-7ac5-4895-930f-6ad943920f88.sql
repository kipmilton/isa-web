-- Create withdrawals table with proper RLS policies
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  mpesa_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor access only
CREATE POLICY "Vendors can view their own withdrawals" 
ON public.withdrawals 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create their own withdrawals" 
ON public.withdrawals 
FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own withdrawals" 
ON public.withdrawals 
FOR UPDATE 
USING (auth.uid() = vendor_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix existing database functions with proper search paths
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