-- Update invitations table to store temporary passwords and improve invitation system
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Function to generate secure temporary passwords
CREATE OR REPLACE FUNCTION public.generate_invitation_credentials(
  invitation_email TEXT,
  invitation_role public.app_role,
  invite_property_id UUID DEFAULT NULL,
  invite_room_id UUID DEFAULT NULL,
  invited_by_user UUID DEFAULT auth.uid()
) 
RETURNS TABLE(
  invitation_id UUID,
  email TEXT,
  temporary_password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password TEXT;
  invitation_record RECORD;
BEGIN
  -- Generate a secure temporary password
  temp_password := upper(substring(md5(random()::text) from 1 for 4)) || 
                   lower(substring(md5(random()::text) from 1 for 4));
  
  -- Insert invitation record
  INSERT INTO public.invitations (
    email,
    role,
    property_id,
    room_id,
    invited_by,
    temporary_password,
    password_hash,
    expires_at
  ) VALUES (
    invitation_email,
    invitation_role,
    invite_property_id,
    invite_room_id,
    invited_by_user,
    temp_password,
    public.hash_password(temp_password),
    NOW() + INTERVAL '30 days'
  )
  RETURNING * INTO invitation_record;
  
  -- Return the invitation details
  RETURN QUERY
  SELECT 
    invitation_record.id,
    invitation_record.email,
    invitation_record.temporary_password,
    invitation_record.expires_at;
END;
$$;

-- Function to verify login credentials
CREATE OR REPLACE FUNCTION public.verify_invitation_login(
  login_email TEXT,
  login_password TEXT
)
RETURNS TABLE(
  user_role public.app_role,
  property_id UUID,
  room_id UUID,
  invitation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Find matching invitation with valid password
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = login_email
    AND is_used = FALSE
    AND expires_at > NOW()
    AND (
      temporary_password = login_password OR
      public.verify_password(login_password, password_hash)
    )
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF invitation_record.id IS NOT NULL THEN
    -- Return the invitation details
    RETURN QUERY
    SELECT 
      invitation_record.role,
      invitation_record.property_id,
      invitation_record.room_id,
      invitation_record.id;
  END IF;
  
  RETURN;
END;
$$;

-- Function to use an invitation (mark as used)
CREATE OR REPLACE FUNCTION public.use_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invitations 
  SET is_used = TRUE, temporary_password = NULL
  WHERE id = invitation_id;
  
  RETURN FOUND;
END;
$$;