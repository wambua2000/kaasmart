
-- Tighten profiles INSERT - users can only insert their own profile
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
