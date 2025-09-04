import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { initiateIsaPayment, IsaPayMethod, getIsaPaymentStatus } from "../../services/isaPayService";
import { useToast } from "../ui/use-toast";
import IsaPayTerms from "./IsaPayTerms";

interface IsaPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  amount: number;
  currency?: string;
  orderId?: string;
  description?: string;
  onSuccess?: (tx: { transaction_id: string; provider: string }) => void;
}

export default function IsaPayModal({ open, onOpenChange, userId, amount, currency = 'KES', orderId, description, onSuccess }: IsaPayModalProps) {
  const [loading, setLoading] = useState<IsaPayMethod | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const pollRef = useRef<number | null>(null);
  const pollStartRef = useRef<number | null>(null);
  const { toast } = useToast();

  async function handlePay(method: IsaPayMethod) {
    try {
      setLoading(method);
      const resp = await initiateIsaPayment({ user_id: userId, amount, currency, method, order_id: orderId, description });
      setTransactionId(resp.transaction_id);
      setStatus('pending');
      setStatusMessage('Waiting for payment confirmation...');
      if (resp.redirect_url) {
        window.location.href = resp.redirect_url;
      } else {
        startPolling(resp.transaction_id);
      }
    } catch (e: any) {
      toast({ title: 'Payment failed', description: e?.message ?? 'Unexpected error' });
    } finally {
      setLoading(null);
    }
  }

  function startPolling(id: string) {
    // Clear any existing
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollStartRef.current = Date.now();
    setStatus('pending');
    setStatusMessage('Waiting for payment confirmation...');
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await getIsaPaymentStatus(id);
        if (res.status === 'success') {
          setStatus('success');
          setStatusMessage('Payment confirmed. Completing...');
          if (onSuccess) onSuccess({ transaction_id: id, provider: res.provider });
          stopPolling();
          onOpenChange(false);
        } else if (res.status === 'failed') {
          setStatus('failed');
          setStatusMessage('Payment failed. Please try again.');
          stopPolling();
        } else {
          setStatus('pending');
          setStatusMessage('Still pending... You may receive a prompt on your device.');
        }
      } catch (err) {
        // ignore transient errors
      }
      // timeout after 3 minutes
      if (pollStartRef.current && Date.now() - pollStartRef.current > 180000) {
        setStatus('pending');
        setStatusMessage('Taking longer than usual. We will update once confirmed.');
        stopPolling();
      }
    }, 4000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    if (!open) {
      stopPolling();
      setTransactionId(null);
      setStatus('idle');
      setStatusMessage('');
    }
    return () => {
      stopPolling();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/isa-uploads/7ca124d8-f236-48e9-9584-a2cd416c5b6b.png" alt="ISA Pay" className="h-6" />
            <span>Pay securely with ISA Pay</span>
          </DialogTitle>
          <DialogDescription>Encrypted checkout. We never share your card or wallet details with merchants.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button disabled={loading !== null} onClick={() => handlePay('card_bank')} className="w-full">Pay with Card / Bank (DPO)</Button>
          <Button disabled={loading !== null} onClick={() => handlePay('mpesa')} variant="secondary" className="w-full">Pay with M-Pesa</Button>
          <Button disabled={loading !== null} onClick={() => handlePay('airtel')} variant="secondary" className="w-full">Pay with Airtel Money</Button>
          <Button disabled={loading !== null} onClick={() => handlePay('paypal')} variant="outline" className="w-full">Pay with PayPal</Button>
          {status !== 'idle' && (
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Payment Status</div>
                  <div className="text-muted-foreground">{statusMessage}</div>
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
          <div className="text-xs text-muted-foreground text-center">Secured by ISA Pay™</div>
          <details className="text-[10px] text-muted-foreground">
            <summary className="cursor-pointer text-center">View Terms of Service</summary>
            <div className="mt-2">
              <IsaPayTerms />
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}


