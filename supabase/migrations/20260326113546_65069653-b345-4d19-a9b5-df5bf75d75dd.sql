
-- Drop all FK constraints referencing auth.users to allow data import
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_tenant_id_fkey;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_manager_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_recorded_by_fkey;
ALTER TABLE public.payment_reminders DROP CONSTRAINT IF EXISTS payment_reminders_tenant_id_fkey;
ALTER TABLE public.payment_reminders DROP CONSTRAINT IF EXISTS payment_reminders_sent_by_fkey;
ALTER TABLE public.manager_properties DROP CONSTRAINT IF EXISTS manager_properties_manager_id_fkey;
ALTER TABLE public.manager_properties DROP CONSTRAINT IF EXISTS manager_properties_assigned_by_fkey;
ALTER TABLE public.agent_properties DROP CONSTRAINT IF EXISTS agent_properties_agent_id_fkey;
ALTER TABLE public.agent_properties DROP CONSTRAINT IF EXISTS agent_properties_assigned_by_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.lease_documents DROP CONSTRAINT IF EXISTS lease_documents_tenant_id_fkey;

-- Also drop FK from rooms/invitations referencing rooms
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_room_id_fkey;
