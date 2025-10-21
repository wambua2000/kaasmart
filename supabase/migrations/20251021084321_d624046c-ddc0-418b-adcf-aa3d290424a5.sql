-- Clean up existing tenant data and set proper tenant_id
-- This fixes the issue where tenants were invited but tenant_id wasn't set

-- Update the room for faithngima91@gmail.com in Banana house with proper tenant_id
UPDATE public.rooms
SET tenant_id = '182f66f9-bc1a-4c60-814e-05837e5bc423'
WHERE id = '955823b6-710c-43c9-860a-e61d39f3deb4'
  AND tenant_email = 'faithngima91@gmail.com';

-- Clear any duplicate room assignments for this tenant (Pearl property)
UPDATE public.rooms
SET 
  tenant_id = NULL,
  tenant_name = NULL,
  tenant_email = NULL,
  tenant_phone = NULL,
  tenant_accessories = NULL,
  tenant_date_of_entry = NULL,
  tenant_notes = NULL,
  is_occupied = FALSE,
  rent_status = 'not-paid'
WHERE tenant_email = 'faithngima91@gmail.com'
  AND id != '955823b6-710c-43c9-860a-e61d39f3deb4';