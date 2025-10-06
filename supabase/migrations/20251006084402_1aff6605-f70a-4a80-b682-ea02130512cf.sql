-- Ensure pgcrypto extension is enabled (required for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Verify and recreate hash_password function with proper schema reference
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Use crypt function with bcrypt for secure password hashing
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

-- Verify and recreate verify_password function with proper schema reference
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN extensions.crypt(password, hash) = hash;
END;
$$;