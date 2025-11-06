-- Replace DPO with Pesapal in transactions table
-- First, update any existing DPO transactions to Pesapal
update public.transactions
  set provider = 'Pesapal'
  where provider = 'DPO';

-- Drop the old constraint
alter table public.transactions
  drop constraint if exists transactions_provider_check;

-- Add new constraint with Pesapal instead of DPO
alter table public.transactions
  add constraint transactions_provider_check
  check (provider in ('Pesapal','M-Pesa','Airtel','PayPal'));

