-- Create a policy to allow developers to manage invitations
CREATE POLICY "Developers can manage all invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'developer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'developer'
  )
);

-- Allow developers to view all properties
CREATE POLICY "Developers can view all properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'developer'
  )
);

-- Allow developers to view all profiles
CREATE POLICY "Developers can view all user profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'developer'
  )
);