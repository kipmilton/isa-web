-- Create order_returns table for handling return requests
CREATE TABLE IF NOT EXISTS public.order_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  return_type TEXT NOT NULL CHECK (return_type IN ('replacement', 'exchange', 'refund')),
  customer_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

-- Create policies for order_returns table
CREATE POLICY "Customers can view their own returns" 
ON public.order_returns 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create their own returns" 
ON public.order_returns 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all returns" 
ON public.order_returns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'product_approver', 'customer_support')
  )
);

CREATE POLICY "Admins can update all returns" 
ON public.order_returns 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('main_admin', 'product_approver', 'customer_support')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_order_returns_updated_at
BEFORE UPDATE ON public.order_returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_order_returns_order_id ON public.order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_customer_id ON public.order_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_status ON public.order_returns(status);
CREATE INDEX IF NOT EXISTS idx_order_returns_created_at ON public.order_returns(created_at);
