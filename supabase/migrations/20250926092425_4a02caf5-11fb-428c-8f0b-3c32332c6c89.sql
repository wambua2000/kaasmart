-- Insert initial owner profile for testing
-- First we need to create a user account manually (this would normally be done through signup)
-- For testing purposes, we'll create an invitation that can be used to sign up as an owner

INSERT INTO public.invitations (email, password, role, invited_by)
VALUES ('owner@kaasmart.com', 'owner123', 'owner', NULL)
ON CONFLICT DO NOTHING;