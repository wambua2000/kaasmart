-- Fix search_path mutable warnings by setting fixed search_path on functions
-- Update hash_password function
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use crypt function with bcrypt for secure password hashing
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update verify_password function
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_invitation_credentials function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update clear_temporary_password function
CREATE OR REPLACE FUNCTION public.clear_temporary_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_used = TRUE AND OLD.is_used = FALSE THEN
    NEW.temporary_password = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;