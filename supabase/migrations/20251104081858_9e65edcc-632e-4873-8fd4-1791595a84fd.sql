-- Update handle_invitation_signup trigger to support agent role

CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if this email has a valid invitation
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE invitations.email = NEW.email
    AND is_used = FALSE 
    AND invitations.expires_at > NOW()
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
    
    -- Insert role into user_roles table using the invitation role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invitation_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark invitation as used and clear temporary password
    UPDATE public.invitations 
    SET is_used = TRUE, temporary_password = NULL
    WHERE id = invitation_record.id;
    
    -- If manager invitation, create manager-property relationship
    IF invitation_record.role = 'manager' THEN
      RAISE LOG 'Creating manager-property relationship for user %, property_id: %', NEW.id, invitation_record.property_id;
      
      IF invitation_record.property_id IS NOT NULL THEN
        -- Single property assignment
        INSERT INTO public.manager_properties (manager_id, property_id, assigned_by)
        VALUES (NEW.id, invitation_record.property_id, invitation_record.invited_by)
        ON CONFLICT (manager_id, property_id) DO NOTHING;
        
        RAISE LOG 'Single property assigned: %', invitation_record.property_id;
      ELSE
        -- All properties access
        INSERT INTO public.manager_properties (manager_id, property_id, can_manage_all, assigned_by)
        VALUES (NEW.id, NULL, TRUE, invitation_record.invited_by)
        ON CONFLICT (manager_id, property_id) DO NOTHING;
        
        RAISE LOG 'All properties access granted';
      END IF;
    END IF;
    
    -- If agent invitation, create agent-property relationship
    IF invitation_record.role = 'agent' THEN
      RAISE LOG 'Creating agent-property relationship for user %, property_id: %', NEW.id, invitation_record.property_id;
      
      IF invitation_record.property_id IS NOT NULL THEN
        -- Single property assignment
        INSERT INTO public.agent_properties (agent_id, property_id, assigned_by)
        VALUES (NEW.id, invitation_record.property_id, invitation_record.invited_by)
        ON CONFLICT (agent_id, property_id) DO NOTHING;
        
        RAISE LOG 'Single property assigned for agent: %', invitation_record.property_id;
      ELSE
        -- All properties access
        INSERT INTO public.agent_properties (agent_id, property_id, can_manage_all, assigned_by)
        VALUES (NEW.id, NULL, TRUE, invitation_record.invited_by)
        ON CONFLICT (agent_id, property_id) DO NOTHING;
        
        RAISE LOG 'All properties access granted for agent';
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