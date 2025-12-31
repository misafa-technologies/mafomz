-- Add M-Pesa/Payment configuration table
CREATE TABLE public.payment_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mpesa',
  config_name TEXT NOT NULL,
  consumer_key TEXT,
  consumer_secret TEXT,
  shortcode TEXT,
  passkey TEXT,
  callback_url TEXT,
  environment TEXT DEFAULT 'sandbox',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own payment configs" 
ON public.payment_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment configs" 
ON public.payment_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment configs" 
ON public.payment_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment configs" 
ON public.payment_configs 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment configs" 
ON public.payment_configs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_payment_configs_updated_at
BEFORE UPDATE ON public.payment_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add bot execution logs table for advanced bot tracking
CREATE TABLE public.bot_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bot_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  profit_loss NUMERIC DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for bot executions
CREATE POLICY "Users can view their own bot executions" 
ON public.bot_executions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bot executions" 
ON public.bot_executions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot executions" 
ON public.bot_executions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bot executions" 
ON public.bot_executions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin platform settings for M-Pesa global config
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES 
  ('mpesa_enabled', 'true'),
  ('mpesa_default_environment', 'sandbox'),
  ('commission_rate', '0.10'),
  ('auto_payout_enabled', 'false'),
  ('min_payout_amount', '100')
ON CONFLICT DO NOTHING;

-- Add scheduling fields to bot_configs
ALTER TABLE public.bot_configs 
ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS schedule_cron TEXT,
ADD COLUMN IF NOT EXISTS max_daily_trades INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS stop_loss_percentage NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS take_profit_percentage NUMERIC DEFAULT 20,
ADD COLUMN IF NOT EXISTS stake_amount NUMERIC DEFAULT 1;