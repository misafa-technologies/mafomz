
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS deriv_app_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS creator_commission_percentage numeric DEFAULT 20;

COMMENT ON COLUMN public.sites.deriv_app_id IS 'Creator''s own Deriv App ID for their site OAuth';
COMMENT ON COLUMN public.sites.creator_commission_percentage IS 'Percentage the creator takes from trader commissions on their site';
