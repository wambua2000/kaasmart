-- Fix the handle_new_user function to have proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if this is an invitation signup
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::public.app_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Mark invitation as used if exists
  UPDATE public.invitations 
  SET is_used = TRUE 
  WHERE email = NEW.email AND is_used = FALSE;
  
  RETURN NEW;
END;
$$;