-- Delete rooms for sample properties first (due to foreign key constraints)
DELETE FROM public.rooms 
WHERE property_id IN (
  'e417e59d-bc59-4fa4-9f81-5933e809e525', -- White House
  'bd51aa71-a462-4cd9-9e94-65a0f5808093', -- Yellow House
  '37c9d62a-4e7a-47ac-b985-7dbd07ca162c', -- Green House
  '6b6880d0-4217-4ad6-8ad4-728b66d5baca', -- Skyline Apartment
  '0123d20d-fe40-4546-ac4b-0c63d07d481d'  -- African Apartment Complex
);

-- Delete the 5 sample properties
DELETE FROM public.properties 
WHERE id IN (
  'e417e59d-bc59-4fa4-9f81-5933e809e525',
  'bd51aa71-a462-4cd9-9e94-65a0f5808093',
  '37c9d62a-4e7a-47ac-b985-7dbd07ca162c',
  '6b6880d0-4217-4ad6-8ad4-728b66d5baca',
  '0123d20d-fe40-4546-ac4b-0c63d07d481d'
);

-- Clean up old invitation records
DELETE FROM public.invitations 
WHERE created_at < NOW() - INTERVAL '7 days' OR is_used = TRUE;

-- Clean up old password reset requests
DELETE FROM public.password_reset_requests 
WHERE status = 'completed' OR created_at < NOW() - INTERVAL '30 days';