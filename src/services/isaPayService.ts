import { supabase } from "../integrations/supabase/client.ts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

async function getAuthHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (data.session?.access_token) headers["Authorization"] = `Bearer ${data.session.access_token}`;
  return headers;
}

export type IsaPayMethod = 'card_bank' | 'mpesa' | 'airtel' | 'paypal';

export async function initiateIsaPayment(params: { user_id: string; amount: number; currency: string; method: IsaPayMethod; phone_number?: string; order_id?: string; description?: string; }): Promise<any> {
  const headers = await getAuthHeader();
  const res = await fetch(`${supabaseUrl}/functions/v1/isa-pay/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error(`MyPlug Pay initiate failed: ${res.status}`);
  return res.json();
}

export async function getIsaPaymentStatus(transactionId: string): Promise<any> {
  const headers = await getAuthHeader();
  const res = await fetch(`${supabaseUrl}/functions/v1/isa-pay/status/${transactionId}`, { headers });
  if (!res.ok) throw new Error(`MyPlug Pay status failed: ${res.status}`);
  return res.json();
}


