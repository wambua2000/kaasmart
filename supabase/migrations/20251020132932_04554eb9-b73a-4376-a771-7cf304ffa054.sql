-- Part 1: Fix handle_invitation_signup to select most recent invitation
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if this email has a valid invitation
  -- ORDER BY created_at DESC to get the MOST RECENT invitation
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND is_used = FALSE 
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If invitation exists, use the invitation details
  IF invitation_record.id IS NOT NULL THEN
    -- Insert profile with invitation details
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      invitation_record.role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Insert role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invitation_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark invitation as used and clear temporary password
    UPDATE public.invitations 
    SET is_used = TRUE, temporary_password = NULL
    WHERE id = invitation_record.id;
    
    -- If manager invitation, create manager-property relationship
    IF invitation_record.role = 'manager' THEN
      IF invitation_record.property_id IS NOT NULL THEN
        -- Single property assignment
        INSERT INTO public.manager_properties (manager_id, property_id, assigned_by)
        VALUES (NEW.id, invitation_record.property_id, invitation_record.invited_by)
        ON CONFLICT (manager_id, property_id) DO NOTHING;
      ELSE
        -- All properties access
        INSERT INTO public.manager_properties (manager_id, property_id, can_manage_all, assigned_by)
        VALUES (NEW.id, NULL, TRUE, invitation_record.invited_by)
        ON CONFLICT (manager_id, property_id) DO NOTHING;
      END IF;
    END IF;
    
    -- If tenant invitation, assign to room
    IF invitation_record.role = 'tenant' AND invitation_record.room_id IS NOT NULL THEN
      UPDATE public.rooms 
      SET tenant_id = NEW.id, is_occupied = TRUE 
      WHERE id = invitation_record.room_id;
    END IF;
  ELSE
    -- No invitation found, create as owner (default behavior)
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'owner')::public.app_role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Insert role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'owner')::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Part 2: Update generate_invitation_credentials to invalidate old invitations
CREATE OR REPLACE FUNCTION public.generate_invitation_credentials(
  invitation_email text, 
  invitation_role app_role, 
  invite_property_id uuid DEFAULT NULL::uuid, 
  invite_room_id uuid DEFAULT NULL::uuid, 
  invited_by_user uuid DEFAULT auth.uid()
)
RETURNS TABLE(invitation_id uuid, email text, temporary_password text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  temp_password TEXT;
  invitation_record RECORD;
BEGIN
  -- First, mark any existing unused invitations for this email as used
  UPDATE public.invitations 
  SET is_used = TRUE, 
      temporary_password = NULL
  WHERE email = invitation_email 
    AND is_used = FALSE 
    AND expires_at > NOW();

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
$function$;

-- Part 5: Clean up existing corrupted data for faithngima91@gmail.com
-- Mark all old invitations as used except the newest one
UPDATE invitations 
SET is_used = TRUE, temporary_password = NULL
WHERE email = 'faithngima91@gmail.com'
  AND is_used = FALSE
  AND id != (
    SELECT id FROM invitations 
    WHERE email = 'faithngima91@gmail.com' 
      AND is_used = FALSE
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- Clear tenant_id from old rooms (keep only the newest assignment)
UPDATE rooms
SET tenant_id = NULL, 
    is_occupied = FALSE,
    tenant_name = NULL,
    tenant_phone = NULL,
    tenant_accessories = NULL
WHERE tenant_email = 'faithngima91@gmail.com'
  AND id != (
    SELECT r.id FROM rooms r
    INNER JOIN invitations i ON i.room_id = r.id
    WHERE i.email = 'faithngima91@gmail.com'
      AND i.is_used = FALSE
    ORDER BY i.created_at DESC
    LIMIT 1
  );