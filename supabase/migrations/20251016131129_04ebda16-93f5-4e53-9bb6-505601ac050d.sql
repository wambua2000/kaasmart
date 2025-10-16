-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view password reset requests" ON password_reset_requests;

-- Create a new policy that only allows developers to view password reset requests
CREATE POLICY "Only developers can view password reset requests"
ON password_reset_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'developer'::app_role
  )
);