-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Only developers can view password reset requests" ON public.password_reset_requests;

-- Allow developers to view only owner password reset requests
CREATE POLICY "Developers can view owner password reset requests"
ON public.password_reset_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'developer'
  )
  AND user_role = 'owner'
);

-- Allow property owners to view tenant and manager password reset requests
CREATE POLICY "Owners can view tenant and manager password reset requests"
ON public.password_reset_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'owner'
  )
  AND user_role IN ('tenant', 'manager')
);