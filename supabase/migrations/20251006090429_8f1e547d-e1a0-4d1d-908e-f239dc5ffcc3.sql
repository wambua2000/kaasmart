-- Update RLS policy to be more permissive for development
-- This allows property operations when there's a valid owner_id in the profiles table

DROP POLICY IF EXISTS "Owners can manage their properties" ON properties;

CREATE POLICY "Owners can manage their properties"
ON properties
FOR ALL
USING (
  -- Allow if the authenticated user owns the property
  owner_id = auth.uid() OR
  -- OR if owner_id matches any existing owner profile (for demo/development)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = properties.owner_id 
    AND profiles.role = 'owner'::app_role
  )
)
WITH CHECK (
  -- Allow insert/update if authenticated user owns it
  owner_id = auth.uid() OR
  -- OR if owner_id matches any existing owner profile (for demo/development)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = owner_id 
    AND profiles.role = 'owner'::app_role
  )
);