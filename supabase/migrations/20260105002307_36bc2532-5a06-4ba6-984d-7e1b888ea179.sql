-- Add platform domain setting
INSERT INTO platform_settings (setting_key, setting_value) 
VALUES ('platform_domain', 'mafomz.io')
ON CONFLICT (setting_key) DO NOTHING;

-- Add contact email/phone if not exists
INSERT INTO platform_settings (setting_key, setting_value) 
VALUES ('contact_email', 'support@mafomz.io')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO platform_settings (setting_key, setting_value) 
VALUES ('contact_phone', '+254 700 000 000')
ON CONFLICT (setting_key) DO NOTHING;

-- Add M-Pesa global credentials settings
INSERT INTO platform_settings (setting_key, setting_value) 
VALUES 
  ('mpesa_shortcode', ''),
  ('mpesa_passkey', ''),
  ('mpesa_consumer_key', ''),
  ('mpesa_consumer_secret', ''),
  ('mpesa_callback_url', '')
ON CONFLICT (setting_key) DO NOTHING;

-- Add moderator policies for support tickets to allow response
DROP POLICY IF EXISTS "Moderators can view all tickets" ON support_tickets;
CREATE POLICY "Moderators can view all tickets" 
ON support_tickets FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS "Moderators can update tickets" ON support_tickets;
CREATE POLICY "Moderators can update tickets" 
ON support_tickets FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can add messages to any ticket
DROP POLICY IF EXISTS "Moderators can add messages" ON ticket_messages;
CREATE POLICY "Moderators can add messages" 
ON ticket_messages FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- Moderators can view all messages
DROP POLICY IF EXISTS "Moderators can view messages" ON ticket_messages;
CREATE POLICY "Moderators can view messages" 
ON ticket_messages FOR SELECT 
USING (has_role(auth.uid(), 'moderator'::app_role));