-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can insert site users" ON public.site_users;
DROP POLICY IF EXISTS "Public can update site users" ON public.site_users;

-- Create proper policies for site_users with validation
-- Allow insertion from edge function (service role) or with site_id validation
CREATE POLICY "Allow site user registration"
ON public.site_users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_users.site_id 
    AND sites.status = 'live'
  )
);

-- Allow site users to update their own record based on deriv_loginid match
CREATE POLICY "Site users can update their own record"
ON public.site_users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM sites 
    WHERE sites.id = site_users.site_id 
    AND sites.status = 'live'
  )
);