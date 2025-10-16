-- Delete all sample invitations with @kaasmart.com emails
DELETE FROM public.invitations 
WHERE email LIKE '%@kaasmart.com%';