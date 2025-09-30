-- Update RLS policy to prevent managers from inserting messages
-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Managers cannot send messages" ON public.messages;

-- Create policy to prevent managers from inserting messages
CREATE POLICY "Managers cannot send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) != 'manager'::app_role
);

-- Ensure managers can still view messages for properties they manage
-- This policy should already exist, but we'll recreate it to be sure
DROP POLICY IF EXISTS "Managers can view messages for properties they manage" ON public.messages;

CREATE POLICY "Managers can view messages for properties they manage"
ON public.messages
FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'manager'::app_role 
  AND EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = messages.property_id
  )
);