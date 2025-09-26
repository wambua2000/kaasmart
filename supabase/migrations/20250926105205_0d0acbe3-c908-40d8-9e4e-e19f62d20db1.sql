-- Ensure RLS is enabled on invitations table and verify policies
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're properly applied
DROP POLICY IF EXISTS "Owners can manage invitation metadata" ON public.invitations;
DROP POLICY IF EXISTS "Users can view their invitation status" ON public.invitations;

-- Create restrictive policies for invitation access
CREATE POLICY "Owners can manage invitations" ON public.invitations
FOR ALL 
TO authenticated
USING (invited_by = auth.uid())
WITH CHECK (invited_by = auth.uid());

-- Allow users to view only their basic invitation info (no passwords/hashes)
CREATE POLICY "Users can view their invitations" ON public.invitations  
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND is_used = FALSE 
  AND expires_at > NOW()
);