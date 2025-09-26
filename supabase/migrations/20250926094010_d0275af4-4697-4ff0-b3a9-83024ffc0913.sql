-- Create a function to handle sign up using invitations
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if this email has a valid invitation
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND is_used = FALSE 
    AND expires_at > NOW()
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
    
    -- Mark invitation as used
    UPDATE public.invitations 
    SET is_used = TRUE 
    WHERE id = invitation_record.id;
    
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_signup();