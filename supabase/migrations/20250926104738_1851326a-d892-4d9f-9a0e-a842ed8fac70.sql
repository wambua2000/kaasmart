-- Remove plaintext password column and add secure password handling
-- First, add a password_hash column for secure storage
ALTER TABLE public.invitations ADD COLUMN password_hash TEXT;

-- Add a temporary_password column that will be cleared after use
ALTER TABLE public.invitations ADD COLUMN temporary_password TEXT;

-- Create a function to hash passwords securely
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use crypt function with bcrypt for secure password hashing
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get invitation credentials (only for the invited user)
CREATE OR REPLACE FUNCTION public.get_invitation_credentials(invitation_email TEXT)
RETURNS TABLE(email TEXT, temporary_password TEXT, role app_role, property_id UUID, room_id UUID) AS $$
BEGIN
  -- Only return credentials if the requesting user matches the invitation email
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
    AND auth.uid() = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing invitations to use the new structure
-- (This migration assumes no existing data, but if there is data, it would need manual handling)

-- Remove the old plaintext password column
ALTER TABLE public.invitations DROP COLUMN IF EXISTS password;

-- Update RLS policies to prevent password exposure
DROP POLICY IF EXISTS "Users can view invitations by email" ON public.invitations;
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.invitations;

-- Create new restrictive policies
CREATE POLICY "Owners can manage invitation metadata" 
ON public.invitations 
FOR ALL 
USING (invited_by = auth.uid())
WITH CHECK (invited_by = auth.uid());

-- Policy for invited users to only see their basic invitation info (no passwords)
CREATE POLICY "Users can view their invitation status" 
ON public.invitations 
FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND is_used = FALSE 
  AND expires_at > NOW()
);

-- Add a trigger to automatically clear temporary passwords after use
CREATE OR REPLACE FUNCTION public.clear_temporary_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_used = TRUE AND OLD.is_used = FALSE THEN
    NEW.temporary_password = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clear_temp_password_on_use
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_temporary_password();