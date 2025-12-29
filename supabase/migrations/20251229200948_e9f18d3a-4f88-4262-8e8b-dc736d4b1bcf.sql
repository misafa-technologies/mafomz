-- Create commissions table for tracking affiliate earnings
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deriv_loginid TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL DEFAULT 'affiliate', -- affiliate, referral, bonus
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, success, urgent
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bot configurations table
CREATE TABLE public.bot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  xml_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  trade_type TEXT, -- digits, higher_lower, etc
  asset TEXT, -- R_100, R_50, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI signals table
CREATE TABLE public.ai_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- buy, sell, hold
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  entry_price DECIMAL(15,6),
  target_price DECIMAL(15,6),
  stop_loss DECIMAL(15,6),
  timeframe TEXT, -- 1m, 5m, 15m, 1h, 4h, 1d
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_signals ENABLE ROW LEVEL SECURITY;

-- Commissions RLS policies
CREATE POLICY "Users can view their own commissions" ON public.commissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all commissions" ON public.commissions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage commissions" ON public.commissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Announcements RLS policies (everyone can read active)
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Support tickets RLS policies
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Ticket messages RLS policies
CREATE POLICY "Users can view messages on their tickets" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can add messages to their tickets" ON public.ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all messages" ON public.ticket_messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Bot configs RLS policies
CREATE POLICY "Users can view their own bots" ON public.bot_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bots" ON public.bot_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bots" ON public.bot_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bots" ON public.bot_configs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all bots" ON public.bot_configs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- AI signals RLS policies
CREATE POLICY "Users can view signals for their sites" ON public.ai_signals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sites WHERE id = site_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all signals" ON public.ai_signals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bot_configs_updated_at BEFORE UPDATE ON public.bot_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample announcements
INSERT INTO public.announcements (title, content, type, is_active) VALUES 
('Welcome to DerivForge!', 'Start building your trading empire today. Create your first site and connect your Deriv account to begin earning commissions.', 'success', true),
('New Feature: AI Signals', 'We have launched AI-powered trading signals to help your site visitors make better trading decisions.', 'info', true);