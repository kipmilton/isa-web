import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PesaPalPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  amount: number;
  currency?: string;
  orderId?: string;
  subscriptionId?: string;
  description?: string;
  onSuccess?: (tx: { transaction_id: string; provider: string }) => void;
  onFailure?: () => void;
}

export default function PesaPalPayment({
  open,
  onOpenChange,
  userId,
  amount,
  currency = 'KES',
  orderId,
  subscriptionId,
  description,
  onSuccess,
  onFailure
}: PesaPalPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const pollRef = useRef<number | null>(null);
  const { toast } = useToast();

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setStatus('pending');
      
      const { data, error } = await supabase.functions.invoke('isa-pay/initiate', {
        body: {
          user_id: userId,
          amount,
          currency,
          method: 'card_bank',
          order_id: orderId,
          subscription_id: subscriptionId,
          description: description || `Payment for ${orderId ? 'order' : 'subscription'}`
        }
      });

      if (error) throw error;

      setTransactionId(data.transaction_id);
      if (data.redirect_url) {
        setIframeUrl(data.redirect_url);
        startPolling(data.transaction_id);
      } else {
        throw new Error('No payment URL received from PesaPal');
      }
    } catch (e: any) {
      console.error('Payment initiation error:', e);
      setStatus('failed');
      toast({ 
        title: 'Payment Failed', 
        description: e?.message ?? 'Unable to initiate payment', 
        variant: 'destructive' 
      });
      onFailure?.();
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (txId: string) => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = window.setInterval(async () => {
      try {
        // Poll using Supabase client method
        const statusResp = await supabase.functions.invoke('isa-pay/status', {
          body: { transaction_id: txId }
        });

        const txData = statusResp.data;

        if (txData?.status === 'success') {
          setStatus('success');
          stopPolling();
          toast({ 
            title: 'Payment Successful', 
            description: 'Your payment has been confirmed', 
            variant: 'default' 
          });
          onSuccess?.({ transaction_id: txId, provider: 'Pesapal' });
          setTimeout(() => onOpenChange(false), 2000);
        } else if (txData?.status === 'failed') {
          setStatus('failed');
          stopPolling();
          toast({ 
            title: 'Payment Failed', 
            description: 'Payment was not successful', 
            variant: 'destructive' 
          });
          onFailure?.();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (open && !iframeUrl) {
      initiatePayment();
    }
    
    return () => {
      stopPolling();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/myplug-icon.png" alt="MyPlug Pay" className="h-6" />
            <span>Secure Payment</span>
          </DialogTitle>
          <DialogDescription>Complete your payment securely with PesaPal</DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative">
          {loading && !iframeUrl && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading payment gateway...</p>
              </div>
            </div>
          )}

          {iframeUrl && (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0 rounded-lg"
              title="PesaPal Payment"
              sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
            />
          )}

          {status !== 'idle' && (
            <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-slate-800 rounded-lg border p-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Payment Status</div>
                  <div className="text-sm text-muted-foreground">
                    {status === 'pending' && 'Waiting for payment confirmation...'}
                    {status === 'success' && 'Payment confirmed successfully!'}
                    {status === 'failed' && 'Payment failed. Please try again.'}
                  </div>
                  {transactionId && (
                    <div className="text-xs mt-1 text-muted-foreground">Ref: {transactionId}</div>
                  )}
                </div>
                <div className="ml-4">
                  {status === 'pending' && <span className="animate-pulse inline-block h-3 w-3 rounded-full bg-amber-500" />}
                  {status === 'success' && <span className="inline-block h-3 w-3 rounded-full bg-green-600" />}
                  {status === 'failed' && <span className="inline-block h-3 w-3 rounded-full bg-red-600" />}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Secured by PesaPal™ | MyPlug Technologies Limited
        </div>
      </DialogContent>
    </Dialog>
  );
}
