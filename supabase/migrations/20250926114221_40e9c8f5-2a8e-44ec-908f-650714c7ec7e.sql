-- Fix invitation password security vulnerability
-- Remove the insecure policy that exposes password data
DROP POLICY IF EXISTS "Users can view their invitations" ON public.invitations;

-- Create a secure function for users to check their invitation status
-- This function only returns non-sensitive information
CREATE OR REPLACE FUNCTION public.get_invitation_status(user_email text)
RETURNS TABLE(
  id uuid,
  role app_role,
  property_id uuid,
  room_id uuid,
  is_used boolean,
  expires_at timestamp with time zone,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return non-sensitive invitation data for the requesting user
  RETURN QUERY
  SELECT 
    i.id,
    i.role,
    i.property_id,
    i.room_id,
    i.is_used,
    i.expires_at,
    i.created_at
  FROM public.invitations i
  INNER JOIN auth.users u ON u.email = user_email
  WHERE i.email = user_email 
    AND auth.uid() = u.id
    AND i.is_used = FALSE 
    AND i.expires_at > NOW();
END;
$$;

-- Create a restrictive policy that prevents direct access to sensitive fields
CREATE POLICY "Users can check invitation status" ON public.invitations
FOR SELECT
TO authenticated
USING (
  -- Allow access only through the secure function by making direct access impossible
  -- This policy will never match, forcing users to use the secure function
  false
);

-- Update the existing function to be more secure
CREATE OR REPLACE FUNCTION public.get_invitation_credentials(invitation_email text)
RETURNS TABLE(email text, temporary_password text, role app_role, property_id uuid, room_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return credentials if the requesting user matches the invitation email
  -- And only return the temporary password, never the hash
  RETURN QUERY
  SELECT 
    i.email,
    i.temporary_password,
    i.role,
    i.property_id,
    i.room_id
  FROM public.invitations i
  INNER JOIN auth.users u ON u.email = invitation_email
  WHERE i.email = invitation_email 
    AND i.is_used = FALSE 
    AND i.expires_at > NOW()
    AND auth.uid() = u.id
    AND i.temporary_password IS NOT NULL; -- Only return if temp password exists
END;
$$;

-- Add a trigger to automatically clear temporary password when invitation is used
CREATE OR REPLACE FUNCTION public.clear_temporary_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_used = TRUE AND OLD.is_used = FALSE THEN
    NEW.temporary_password = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS clear_temp_password_on_use ON public.invitations;
CREATE TRIGGER clear_temp_password_on_use
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_temporary_password();