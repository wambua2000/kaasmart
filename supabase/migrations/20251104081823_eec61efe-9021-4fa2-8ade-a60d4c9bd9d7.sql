-- Phase 2: Create Agent Tables and Policies

-- Create agent_properties table for agent-property assignments
CREATE TABLE IF NOT EXISTS public.agent_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  can_manage_all BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(agent_id, property_id)
);

ALTER TABLE public.agent_properties ENABLE ROW LEVEL SECURITY;

-- Agents can view their own assignments
CREATE POLICY "Agents can view their own assignments"
ON public.agent_properties FOR SELECT
TO authenticated
USING (auth.uid() = agent_id);

-- Owners can manage assignments for their properties
CREATE POLICY "Owners can manage agent assignments"
ON public.agent_properties FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) 
  AND (
    can_manage_all = true 
    OR EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = agent_properties.property_id 
      AND properties.owner_id = auth.uid()
    )
  )
);

-- Developers can view all assignments
CREATE POLICY "Developers can view all agent assignments"
ON public.agent_properties FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role));

CREATE INDEX IF NOT EXISTS idx_agent_properties_lookup 
ON public.agent_properties(agent_id, property_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own payments
CREATE POLICY "Tenants can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

-- Agents can manage payments for assigned properties
CREATE POLICY "Agents can manage payments for assigned properties"
ON public.payments FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND EXISTS (
    SELECT 1 FROM agent_properties ap 
    WHERE ap.agent_id = auth.uid() 
    AND (ap.can_manage_all = true OR ap.property_id = payments.property_id)
  )
);

-- Property owners can view payments for their properties
CREATE POLICY "Owners can view payments for their properties"
ON public.payments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) 
  AND EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = payments.property_id 
    AND p.owner_id = auth.uid()
  )
);

-- Developers can view all payments
CREATE POLICY "Developers can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role));

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON public.payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

CREATE TRIGGER update_payments_updated_at 
BEFORE UPDATE ON public.payments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create payment_reminders table
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount_due NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  message TEXT,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own reminders"
ON public.payment_reminders FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Agents can manage reminders for assigned properties"
ON public.payment_reminders FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role)
  AND EXISTS (
    SELECT 1 FROM agent_properties ap 
    WHERE ap.agent_id = auth.uid() 
    AND (ap.can_manage_all = true OR ap.property_id = payment_reminders.property_id)
  )
);

CREATE POLICY "Owners can view reminders for their properties"
ON public.payment_reminders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role)
  AND EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = payment_reminders.property_id 
    AND p.owner_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_tenant ON public.payment_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_due_date ON public.payment_reminders(due_date);

CREATE TRIGGER update_payment_reminders_updated_at 
BEFORE UPDATE ON public.payment_reminders 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper functions for agent access
CREATE OR REPLACE FUNCTION public.can_manage_property_as_agent(_user_id UUID, _property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agent_properties ap
    WHERE ap.agent_id = _user_id
      AND (ap.can_manage_all = true OR ap.property_id = _property_id)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_agent_properties_with_stats(agent_user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  location TEXT,
  rent_per_room NUMERIC,
  total_rooms INTEGER,
  image_url TEXT,
  occupied_rooms BIGINT,
  total_collected NUMERIC,
  pending_amount NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.name,
    p.location,
    p.rent_per_room,
    p.total_rooms,
    p.image_url,
    COUNT(CASE WHEN r.is_occupied = true THEN 1 END) as occupied_rooms,
    COALESCE(SUM(pay.amount), 0) as total_collected,
    (COUNT(CASE WHEN r.is_occupied = true THEN 1 END) * p.rent_per_room) - COALESCE(SUM(pay.amount), 0) as pending_amount
  FROM properties p
  INNER JOIN agent_properties ap ON (ap.can_manage_all = true OR ap.property_id = p.id)
  LEFT JOIN rooms r ON r.property_id = p.id
  LEFT JOIN payments pay ON pay.property_id = p.id 
    AND EXTRACT(MONTH FROM pay.payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM pay.payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  WHERE ap.agent_id = agent_user_id
  GROUP BY p.id, p.name, p.location, p.rent_per_room, p.total_rooms, p.image_url
  ORDER BY p.name;
$$;

-- Update RLS policies for existing tables

-- Add message_type column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'general';

-- Agents can view messages for assigned properties
CREATE POLICY "Agents can view messages for assigned properties"
ON public.messages FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND EXISTS (
    SELECT 1 FROM agent_properties ap 
    WHERE ap.agent_id = auth.uid() 
    AND (ap.can_manage_all = true OR ap.property_id = messages.property_id)
  )
);

-- Agents can send messages for assigned properties
CREATE POLICY "Agents can send messages for assigned properties"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role)
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_properties ap 
    WHERE ap.agent_id = auth.uid() 
    AND (ap.can_manage_all = true OR ap.property_id = messages.property_id)
  )
);

-- Agents can view rooms for assigned properties
CREATE POLICY "Agents can view rooms for assigned properties"
ON public.rooms FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND can_manage_property_as_agent(auth.uid(), property_id)
);

-- Agents can update room rent status
CREATE POLICY "Agents can update room rent status"
ON public.rooms FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role) 
  AND can_manage_property_as_agent(auth.uid(), property_id)
);

-- Agents can view tenant profiles in their assigned properties
CREATE POLICY "Agents can view tenant profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'agent'::app_role)
  AND (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rooms r
      INNER JOIN agent_properties ap ON (
        ap.agent_id = auth.uid() 
        AND (ap.can_manage_all = true OR ap.property_id = r.property_id)
      )
      WHERE r.tenant_id = profiles.id
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      INNER JOIN agent_properties ap ON (
        ap.agent_id = auth.uid()
        AND (ap.can_manage_all = true OR ap.property_id = p.id)
      )
      WHERE p.owner_id = profiles.id
    )
  )
);