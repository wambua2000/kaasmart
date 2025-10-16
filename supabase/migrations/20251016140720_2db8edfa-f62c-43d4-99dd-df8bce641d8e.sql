-- Delete all sample password reset requests with @kaasmart.com emails
DELETE FROM public.password_reset_requests 
WHERE email LIKE '%@kaasmart.com%';