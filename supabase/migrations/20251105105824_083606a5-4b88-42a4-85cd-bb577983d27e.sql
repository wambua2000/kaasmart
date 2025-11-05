-- Update RLS policy to allow property owners to view agent password reset requests
DROP POLICY IF EXISTS "Owners can view tenant and manager password reset requests" ON password_reset_requests;

CREATE POLICY "Owners can view tenant, manager, and agent password reset requests"
  ON password_reset_requests
  FOR SELECT
  USING (
    has_role(auth.uid(), 'owner'::app_role) 
    AND user_role IN ('tenant'::app_role, 'manager'::app_role, 'agent'::app_role)
  );