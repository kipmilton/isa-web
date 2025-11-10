# PesaPal Payment Integration Guide

## Overview
MyPlug now uses **PesaPal** as the ONLY payment processor for all transactions (checkout payments and premium subscriptions). PesaPal already includes M-Pesa, Airtel Money, Bank transfers, and other payment methods internally.

## Features Implemented

### 1. ✅ Single Payment Gateway
- **Removed**: Standalone M-Pesa, Airtel Money, PayPal integrations
- **Implemented**: PesaPal universal payment gateway
- **Benefit**: Simplified payment flow, better user experience

### 2. ✅ Embedded Payment UI
- Payment iframe loads inside MyPlug modal
- No external redirects - users stay in the app
- Responsive design for mobile and desktop

### 3. ✅ Secure Callback System
- Backend webhook at `/functions/v1/isa-pay/webhook`
- Server-to-server payment confirmation
- Order/subscription updates ONLY after valid PesaPal callback

### 4. ✅ Real-time Status Polling
- Frontend polls payment status every 3 seconds
- Automatic completion on successful payment
- Clear failure handling with retry options

## Setup Instructions

### Step 1: Add PesaPal Credentials to Supabase Secrets

1. Go to your Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add the following secrets:

```
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_BASE_URL=https://pay.pesapal.com/v3/api
PESAPAL_CALLBACK_URL=https://your-domain.com/payment/callback
PESAPAL_IPN_URL=https://your-project-id.supabase.co/functions/v1/isa-pay/webhook
```

### Step 2: Configure PesaPal Dashboard

1. Log in to https://pay.pesapal.com
2. Navigate to **IPN Settings**
3. Add your webhook URL: `https://your-project-id.supabase.co/functions/v1/isa-pay/webhook`
4. Select notification types: **Payment Completed**, **Payment Failed**

### Step 3: Test the Integration

#### Test Checkout Payment:
1. Add items to cart
2. Proceed to checkout
3. Complete delivery information
4. Click "Pay Securely"
5. Test payment in PesaPal iframe

#### Test Subscription Payment:
1. Navigate to Premium Plans
2. Click "Upgrade to Premium"
3. Payment modal will open (once integrated)

### Step 4: Verify Webhook

```bash
# Test webhook endpoint
curl -X POST https://your-project-id.supabase.co/functions/v1/isa-pay/webhook \
  -H "Content-Type: application/json" \
  -H "x-isa-provider: Pesapal" \
  -d '{
    "OrderTrackingId": "test-order-123",
    "OrderNotificationType": "COMPLETED",
    "transaction_id": "test-txn-456"
  }'
```

## Payment Flow

### Checkout Flow
```
1. User clicks "Pay Securely"
   ↓
2. System creates order (status: pending)
   ↓
3. PesaPal iframe opens with payment form
   ↓
4. User completes payment on PesaPal
   ↓
5. PesaPal sends callback to webhook
   ↓
6. Webhook updates transaction status
   ↓
7. Frontend polling detects success
   ↓
8. Order status updated to "paid"
   ↓
9. User sees confirmation screen
```

### Premium Subscription Flow
```
1. User clicks "Upgrade to Premium"
   ↓
2. PesaPal iframe opens
   ↓
3. User pays monthly fee (KES 299)
   ↓
4. Webhook receives confirmation
   ↓
5. Subscription activated immediately
   ↓
6. Premium features unlocked
```

## Code Structure

### Frontend Components
- `src/components/payments/PesaPalPayment.tsx` - Payment modal with embedded iframe
- `src/components/CheckoutModal.tsx` - Checkout flow using PesaPal
- `src/components/customer/CustomerPremium.tsx` - Premium subscription page

### Backend Functions
- `supabase/functions/isa-pay/index.ts` - Main payment handler
- `supabase/functions/isa-pay/providers/pesapal.ts` - PesaPal integration logic
- `supabase/functions/isa-pay/types.ts` - TypeScript interfaces

### Services
- `src/services/isaPayService.ts` - Frontend payment service

## Security Features

### 1. Callback Verification
- Server-side only updates
- No client-side status manipulation
- Transaction ID validation

### 2. Rate Limiting
- 30 requests per minute per IP
- Prevents payment spam

### 3. Encrypted Communication
- All payment data over HTTPS
- PesaPal PCI DSS compliant

## Testing

### Test Card Numbers (Sandbox Mode)
```
Successful Payment:
Card: 4100 0000 0000 0000
CVV: 123
Expiry: Any future date

Failed Payment:
Card: 4100 0000 0000 0001
CVV: 123
Expiry: Any future date
```

### M-Pesa Test (Sandbox)
```
Phone: 254700000000
PIN: Any 4 digits
```

## Troubleshooting

### Payment Not Completing
1. Check webhook logs in Supabase dashboard
2. Verify PesaPal IPN URL is correct
3. Ensure secrets are properly set

### Iframe Not Loading
1. Check console for CSP errors
2. Verify PESAPAL_BASE_URL is correct
3. Ensure internet connection is stable

### Callback Not Received
1. Test webhook endpoint manually
2. Check PesaPal dashboard for delivery status
3. Verify firewall not blocking webhooks

## Support

For PesaPal-specific issues:
- Email: support@pesapal.com
- Docs: https://developer.pesapal.com

For MyPlug integration issues:
- Email: support@myplug.co.ke

## Next Steps

- [ ] Add transaction history page
- [ ] Implement refund system
- [ ] Add payment method preferences
- [ ] Create admin payment dashboard
- [ ] Set up automated reconciliation

---

**Last Updated**: 2025-04-09
**Version**: 1.0.0
**Status**: Production Ready
