-- Add staff visibility into profiles for admin/moderator operations (user counts, moderation)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Staff can view all profiles'
  ) THEN
    CREATE POLICY "Staff can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    );
  END IF;
END $$;
