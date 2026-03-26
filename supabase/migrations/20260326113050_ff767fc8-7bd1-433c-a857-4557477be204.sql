
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'owner', 'manager', 'tenant', 'developer', 'agent');

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow insert for authenticated" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow select all for authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow select all roles for authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  rent_per_room numeric,
  total_rooms integer DEFAULT 0,
  owner_id uuid REFERENCES auth.users(id),
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  manager_id uuid REFERENCES auth.users(id)
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage own properties" ON public.properties FOR ALL TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Authenticated can view properties" ON public.properties FOR SELECT TO authenticated USING (true);

-- Rooms table
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_number text,
  rent_amount numeric,
  is_occupied boolean DEFAULT false,
  tenant_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tenant_name text,
  tenant_email text,
  tenant_phone text,
  tenant_date_of_entry date,
  rent_status text DEFAULT 'not-paid',
  tenant_accessories text,
  tenant_notes text
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage rooms" ON public.rooms FOR ALL TO authenticated USING (true);

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id),
  receiver_id uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES public.properties(id),
  content text,
  created_at timestamptz DEFAULT now(),
  message_type text DEFAULT 'general',
  is_read boolean DEFAULT false,
  read_at timestamptz
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES public.properties(id),
  room_id uuid,
  is_used boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  password_hash text,
  temporary_password text
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view invitations" ON public.invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage invitations" ON public.invitations FOR ALL TO authenticated USING (true);

-- Payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES auth.users(id),
  room_id uuid REFERENCES public.rooms(id),
  property_id uuid REFERENCES public.properties(id),
  amount numeric,
  payment_date date,
  payment_method text,
  reference_number text,
  receipt_url text,
  status text DEFAULT 'pending',
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage payments" ON public.payments FOR ALL TO authenticated USING (true);

-- Payment reminders table
CREATE TABLE public.payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES auth.users(id),
  room_id uuid REFERENCES public.rooms(id),
  property_id uuid REFERENCES public.properties(id),
  amount_due numeric,
  due_date date,
  reminder_date timestamptz,
  status text DEFAULT 'pending',
  message text,
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view reminders" ON public.payment_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage reminders" ON public.payment_reminders FOR ALL TO authenticated USING (true);

-- Password reset requests table
CREATE TABLE public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_role text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  new_password text,
  notes text
);
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view reset requests" ON public.password_reset_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage reset requests" ON public.password_reset_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Anon can insert reset requests" ON public.password_reset_requests FOR INSERT TO anon WITH CHECK (true);

-- Manager properties table
CREATE TABLE public.manager_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  can_manage_all boolean DEFAULT false
);
ALTER TABLE public.manager_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view manager properties" ON public.manager_properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage manager properties" ON public.manager_properties FOR ALL TO authenticated USING (true);

-- Agent properties table
CREATE TABLE public.agent_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  can_manage_all boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.agent_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view agent properties" ON public.agent_properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage agent properties" ON public.agent_properties FOR ALL TO authenticated USING (true);

-- Lease documents table
CREATE TABLE public.lease_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES auth.users(id),
  room_id uuid REFERENCES public.rooms(id),
  property_id uuid REFERENCES public.properties(id),
  file_name text,
  file_path text,
  file_size bigint,
  upload_date timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.lease_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view lease documents" ON public.lease_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage lease documents" ON public.lease_documents FOR ALL TO authenticated USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.password_reset_requests;
