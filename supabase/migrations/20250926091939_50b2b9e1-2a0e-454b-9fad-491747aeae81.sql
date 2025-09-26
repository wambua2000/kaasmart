-- Fix security definer function to have immutable search path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = $1;
$$;