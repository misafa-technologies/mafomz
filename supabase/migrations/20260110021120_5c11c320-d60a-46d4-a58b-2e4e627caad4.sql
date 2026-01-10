-- Create site_users table for users who sign up on created sites
CREATE TABLE public.site_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  deriv_loginid TEXT NOT NULL,
  deriv_email TEXT,
  deriv_fullname TEXT,
  deriv_balance NUMERIC DEFAULT 0,
  deriv_currency TEXT DEFAULT 'USD',
  deriv_accounts JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, deriv_loginid)
);

-- Enable RLS on site_users
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;

-- Policies for site_users
CREATE POLICY "Site owners can view their site users"
ON public.site_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_users.site_id 
    AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all site users"
ON public.site_users FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert site users"
ON public.site_users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update site users"
ON public.site_users FOR UPDATE
USING (true);

-- Create site_bot_store for bots shared by creators
CREATE TABLE public.site_bot_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES public.bot_configs(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  price NUMERIC DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, bot_id)
);

-- Enable RLS on site_bot_store
ALTER TABLE public.site_bot_store ENABLE ROW LEVEL SECURITY;

-- Policies for site_bot_store
CREATE POLICY "Anyone can view public store bots"
ON public.site_bot_store FOR SELECT
USING (is_public = true);

CREATE POLICY "Site owners can manage their store"
ON public.site_bot_store FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_bot_store.site_id 
    AND sites.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all store items"
ON public.site_bot_store FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create commission_splits table for tracking commission distribution
CREATE TABLE public.commission_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('platform', 'site_creator', 'trader')),
  recipient_id UUID,
  percentage NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on commission_splits
ALTER TABLE public.commission_splits ENABLE ROW LEVEL SECURITY;

-- Policies for commission_splits
CREATE POLICY "Users can view their own splits"
ON public.commission_splits FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all splits"
ON public.commission_splits FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add platform commission settings
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES 
  ('platform_commission_percentage', '30'),
  ('site_creator_commission_percentage', '50'),
  ('trader_commission_percentage', '20'),
  ('deriv_app_id', '1089')
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at on site_users
CREATE TRIGGER update_site_users_updated_at
BEFORE UPDATE ON public.site_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();