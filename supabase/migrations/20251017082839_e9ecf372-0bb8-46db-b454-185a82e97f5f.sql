-- Fix search_path for existing functions to prevent security warnings

-- Update handle_new_user function to set proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update update_updated_at_column function to set proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;