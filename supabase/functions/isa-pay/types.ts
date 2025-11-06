export type ProviderName = 'Pesapal' | 'M-Pesa' | 'Airtel' | 'PayPal';

export type InitiateMethod = 'card_bank' | 'mpesa' | 'airtel' | 'paypal';

export interface InitiateRequestBody {
  user_id: string;
  amount: number;
  currency: string;
  method: InitiateMethod;
  order_id?: string;
  description?: string;
  phone_number?: string; // for mobile money
  callback_url?: string;
}

export interface IsaPayResponse {
  transaction_id: string; // isa_xxxx (uuid)
  provider: ProviderName;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: string;
  redirect_url?: string;
  reference_id?: string;
  metadata?: Record<string, unknown>;
}


