// deno-lint-ignore-file no-explicit-any
import type { InitiateRequestBody, IsaPayResponse } from "../types.ts";
import { generateIsaTransactionId } from "../utils.ts";

const DPO_BASE_URL = Deno.env.get('DPO_BASE_URL') ?? 'https://secure.3gdirectpay.com/API/v6/';
const DPO_COMPANY_TOKEN = Deno.env.get('DPO_COMPANY_TOKEN') ?? '';
const DPO_SERVICE_TYPE = Deno.env.get('DPO_SERVICE_TYPE') ?? '';

export async function initiateCardPayment(payload: InitiateRequestBody): Promise<IsaPayResponse> {
  const isaId = generateIsaTransactionId();

  // Placeholder DPO call - replace with actual API request
  // Example: create token / payment page
  const redirectUrl = `${DPO_BASE_URL}pay/${isaId}`;

  return {
    transaction_id: isaId,
    provider: 'DPO',
    status: 'pending',
    amount: payload.amount,
    currency: payload.currency,
    redirect_url: redirectUrl,
    metadata: { service_type: DPO_SERVICE_TYPE, company_token: Boolean(DPO_COMPANY_TOKEN) }
  };
}

export async function verifyCardPayment(_req: Request, body: any): Promise<{ status: 'success' | 'failed' | 'pending'; reference_id?: string; transaction_id?: string } | null> {
  // TODO: verify DPO webhook signature if available; placeholder trusts payload
  const status = mapExternalStatus(body?.status ?? body?.TransactionStatus);
  return { status, reference_id: body?.reference_id ?? body?.TransactionToken, transaction_id: body?.transaction_id ?? body?.TransactionID };
}

function mapExternalStatus(external: string): 'success' | 'failed' | 'pending' {
  const e = (external || '').toLowerCase();
  if (e.includes('success') || e === 'paid' || e === 'approved') return 'success';
  if (e.includes('fail') || e === 'declined' || e === 'error') return 'failed';
  return 'pending';
}


