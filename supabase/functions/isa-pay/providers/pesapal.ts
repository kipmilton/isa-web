// deno-lint-ignore-file no-explicit-any
import type { InitiateRequestBody, IsaPayResponse } from "../types.ts";
import { generateIsaTransactionId } from "../utils.ts";

const PESAPAL_BASE_URL = Deno.env.get('PESAPAL_BASE_URL') ?? 'https://pay.pesapal.com/v3/api';
const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY') ?? '';
const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET') ?? '';
const PESAPAL_CALLBACK_URL = Deno.env.get('PESAPAL_CALLBACK_URL') ?? '';
const PESAPAL_IPN_URL = Deno.env.get('PESAPAL_IPN_URL') ?? '';

/**
 * Get Pesapal access token for API authentication
 */
async function getPesapalAccessToken(): Promise<string> {
  try {
    const response = await fetch(`${PESAPAL_BASE_URL}/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token || data.access_token || '';
  } catch (error) {
    console.error('Error getting Pesapal access token:', error);
    throw error;
  }
}

/**
 * Initiate a card/bank payment through Pesapal
 */
export async function initiateCardPayment(payload: InitiateRequestBody): Promise<IsaPayResponse> {
  const isaId = generateIsaTransactionId();

  try {
    // Get access token
    const accessToken = await getPesapalAccessToken();

    // Prepare payment request
    const paymentData = {
      id: isaId,
      currency: payload.currency || 'KES',
      amount: payload.amount,
      description: payload.description || `Payment for order ${payload.order_id || isaId}`,
      callback_url: payload.callback_url || PESAPAL_CALLBACK_URL,
      notification_id: PESAPAL_IPN_URL,
      billing_address: {
        email_address: payload.user_id, // Using user_id as email placeholder
        phone_number: payload.phone_number || '',
        country_code: 'KE',
        first_name: '',
        middle_name: '',
        last_name: '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: '',
      },
    };

    // Submit payment order
    const response = await fetch(`${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pesapal payment initiation failed: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const redirectUrl = result.redirect_url || result.payment_url || '';

    return {
      transaction_id: isaId,
      provider: 'Pesapal',
      status: 'pending',
      amount: payload.amount,
      currency: payload.currency,
      redirect_url: redirectUrl,
      reference_id: result.order_tracking_id || result.order_id || isaId,
      metadata: {
        pesapal_order_id: result.order_tracking_id || result.order_id,
        consumer_key: Boolean(PESAPAL_CONSUMER_KEY),
      },
    };
  } catch (error) {
    console.error('Error initiating Pesapal payment:', error);
    // Return a response with error status
    return {
      transaction_id: isaId,
      provider: 'Pesapal',
      status: 'failed',
      amount: payload.amount,
      currency: payload.currency,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

/**
 * Verify Pesapal payment webhook/callback
 */
export async function verifyCardPayment(_req: Request, body: any): Promise<{ status: 'success' | 'failed' | 'pending'; reference_id?: string; transaction_id?: string } | null> {
  try {
    // PesaPal webhook validation
    const orderTrackingId = body.OrderTrackingId || body.order_tracking_id || body.OrderNotificationType;
    const notificationType = body.OrderNotificationType || body.status || body.payment_status;

    // Map PesaPal notification type to our status
    const status = mapExternalStatus(notificationType);

    return {
      status,
      reference_id: orderTrackingId,
      transaction_id: body.transaction_id || body.id,
    };
  } catch (error) {
    console.error('Error verifying PesaPal payment:', error);
    return null;
  }
}

/**
 * Map Pesapal payment status to internal status
 */
function mapExternalStatus(external: string): 'success' | 'failed' | 'pending' {
  const e = (external || '').toLowerCase();
  
  // Pesapal status values
  if (e.includes('completed') || e === 'completed' || e === 'paid' || e === 'success') {
    return 'success';
  }
  if (e.includes('failed') || e.includes('cancelled') || e === 'declined' || e === 'error' || e === 'rejected') {
    return 'failed';
  }
  
  // Default to pending for: pending, processing, etc.
  return 'pending';
}

