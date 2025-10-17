-- Clean up all pending @kaasmart.com invitations
DELETE FROM public.invitations 
WHERE email LIKE '%@kaasmart.com' 
AND is_used = false;