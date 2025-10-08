-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Owners can manage password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Developers can view password reset requests" ON password_reset_requests;
DROP POLICY IF EXISTS "Anyone can request password reset" ON password_reset_requests;

-- Allow anyone to view password reset requests (needed for localStorage-based auth)
CREATE POLICY "Anyone can view password reset requests"
ON password_reset_requests
FOR SELECT
TO public
USING (true);

-- Allow anyone to insert password reset requests (tenants/managers)
CREATE POLICY "Anyone can submit password reset requests"
ON password_reset_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update password reset requests (owners need this)
CREATE POLICY "Anyone can update password reset requests"
ON password_reset_requests
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow anyone to delete old requests
CREATE POLICY "Anyone can delete password reset requests"
ON password_reset_requests
FOR DELETE
TO public
USING (true);