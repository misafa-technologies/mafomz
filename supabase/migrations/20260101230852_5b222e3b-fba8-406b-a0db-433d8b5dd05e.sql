-- Create transactions table for M-Pesa deposits and payments
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit', -- deposit, withdrawal, commission_payout
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  payment_method TEXT DEFAULT 'mpesa',
  phone_number TEXT,
  mpesa_receipt TEXT,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  moderator_id UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_balances table to track user account balances
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KES',
  total_deposits NUMERIC DEFAULT 0,
  total_withdrawals NUMERIC DEFAULT 0,
  total_commissions NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Transaction policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions"
ON public.transactions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view all transactions"
ON public.transactions FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can update transactions"
ON public.transactions FOR UPDATE
USING (has_role(auth.uid(), 'moderator'));

-- Balance policies
CREATE POLICY "Users can view their own balance"
ON public.user_balances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own balance"
ON public.user_balances FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all balances"
ON public.user_balances FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view all balances"
ON public.user_balances FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can update balances"
ON public.user_balances FOR UPDATE
USING (has_role(auth.uid(), 'moderator'));

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at
BEFORE UPDATE ON public.user_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();