-- Phase 1: Create user_roles table for secure role storage
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only system can update roles"
ON public.user_roles FOR UPDATE
USING (false);

CREATE POLICY "Only system can delete roles"
ON public.user_roles FOR DELETE
USING (false);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 2: Create manager_properties table
CREATE TABLE IF NOT EXISTS public.manager_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  can_manage_all boolean DEFAULT false,
  UNIQUE (manager_id, property_id)
);

-- Enable RLS on manager_properties
ALTER TABLE public.manager_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for manager_properties
CREATE POLICY "Managers can view their own assignments"
ON public.manager_properties FOR SELECT
USING (auth.uid() = manager_id);

CREATE POLICY "Owners can view assignments for their properties"
ON public.manager_properties FOR SELECT
USING (
  has_role(auth.uid(), 'owner') AND (
    can_manage_all = true OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = manager_properties.property_id
      AND owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Developers can view all assignments"
ON public.manager_properties FOR SELECT
USING (has_role(auth.uid(), 'developer'));

CREATE POLICY "Owners can manage assignments for their properties"
ON public.manager_properties FOR ALL
USING (
  has_role(auth.uid(), 'owner') AND (
    can_manage_all = true OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = manager_properties.property_id
      AND owner_id = auth.uid()
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'owner') AND (
    can_manage_all = true OR
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = manager_properties.property_id
      AND owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Developers can manage all assignments"
ON public.manager_properties FOR ALL
USING (has_role(auth.uid(), 'developer'))
WITH CHECK (has_role(auth.uid(), 'developer'));

-- Phase 3: Update handle_invitation_signup to populate manager_properties
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if this email has a valid invitation
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND is_used = FALSE 
    AND expires_at > NOW()
  LIMIT 1;
  
  -- If invitation exists, use the invitation details
  IF invitation_record.id IS NOT NULL THEN
    -- Insert profile with invitation details
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      invitation_record.role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Insert role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invitation_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Mark invitation as used and clear temporary password
    UPDATE public.invitations 
    SET is_used = TRUE, temporary_password = NULL
    WHERE id = invitation_record.id;
    
    -- If manager invitation, create manager-property relationship
    IF invitation_record.role = 'manager' THEN
      IF invitation_record.property_id IS NOT NULL THEN
        -- Single property assignment
        INSERT INTO public.manager_properties (manager_id, property_id, assigned_by)
        VALUES (NEW.id, invitation_record.property_id, invitation_record.invited_by)
        ON CONFLICT (manager_id, property_id) DO NOTHING;
      ELSE
        -- All properties access
        INSERT INTO public.manager_properties (manager_id, property_id, can_manage_all, assigned_by)
        VALUES (NEW.id, NULL, TRUE, invitation_record.invited_by)
        ON CONFLICT (manager_id, property_id) DO NOTHING;
      END IF;
    END IF;
    
    -- If tenant invitation, assign to room
    IF invitation_record.role = 'tenant' AND invitation_record.room_id IS NOT NULL THEN
      UPDATE public.rooms 
      SET tenant_id = NEW.id, is_occupied = TRUE 
      WHERE id = invitation_record.room_id;
    END IF;
  ELSE
    -- No invitation found, create as owner (default behavior)
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'owner')::public.app_role,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Insert role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'owner')::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Phase 4: Update RLS policies to use has_role() and manager assignments

-- Drop old property policies that check profiles.role directly
DROP POLICY IF EXISTS "Managers can view properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Developers can view all properties" ON public.properties;

-- Create new property policies using has_role()
CREATE POLICY "Owners can view their own properties"
ON public.properties FOR SELECT
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers can view assigned properties"
ON public.properties FOR SELECT
USING (
  has_role(auth.uid(), 'manager') AND (
    -- Manager can manage all properties
    EXISTS (
      SELECT 1 FROM public.manager_properties mp
      WHERE mp.manager_id = auth.uid() 
      AND mp.can_manage_all = true
    )
    OR
    -- Manager is assigned to this specific property
    EXISTS (
      SELECT 1 FROM public.manager_properties mp
      WHERE mp.manager_id = auth.uid() 
      AND mp.property_id = properties.id
    )
  )
);

CREATE POLICY "Developers can view all properties"
ON public.properties FOR SELECT
USING (has_role(auth.uid(), 'developer'));

-- Update other table policies to use has_role()

-- Profiles table policies
DROP POLICY IF EXISTS "Developers can view all user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;

CREATE POLICY "Developers can view all user profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'developer'));

CREATE POLICY "Owners can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'owner'));

-- Rooms table policies
DROP POLICY IF EXISTS "Property owners can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Managers can update tenant profiles for managed properties" ON public.rooms;

CREATE POLICY "Property owners can manage rooms"
ON public.rooms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = rooms.property_id
    AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = rooms.property_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Managers can view rooms for assigned properties"
ON public.rooms FOR SELECT
USING (
  has_role(auth.uid(), 'manager') AND (
    EXISTS (
      SELECT 1 FROM public.manager_properties mp
      WHERE mp.manager_id = auth.uid()
      AND (mp.can_manage_all = true OR mp.property_id = rooms.property_id)
    )
  )
);

CREATE POLICY "Managers can update rooms for assigned properties"
ON public.rooms FOR UPDATE
USING (
  has_role(auth.uid(), 'manager') AND (
    EXISTS (
      SELECT 1 FROM public.manager_properties mp
      WHERE mp.manager_id = auth.uid()
      AND (mp.can_manage_all = true OR mp.property_id = rooms.property_id)
    )
  )
);

-- Lease documents policies
DROP POLICY IF EXISTS "Property managers can view lease documents for managed properti" ON public.lease_documents;
DROP POLICY IF EXISTS "Property owners can view lease documents for their properties" ON public.lease_documents;
DROP POLICY IF EXISTS "Property owners can update lease document status" ON public.lease_documents;

CREATE POLICY "Property owners can view lease documents"
ON public.lease_documents FOR SELECT
USING (
  has_role(auth.uid(), 'owner') OR 
  tenant_id = auth.uid() OR
  (has_role(auth.uid(), 'manager') AND EXISTS (
    SELECT 1 FROM public.manager_properties mp
    WHERE mp.manager_id = auth.uid()
    AND (mp.can_manage_all = true OR mp.property_id = lease_documents.property_id)
  ))
);

CREATE POLICY "Property owners can update lease status"
ON public.lease_documents FOR UPDATE
USING (has_role(auth.uid(), 'owner') OR tenant_id = auth.uid());

-- Invitations policies
DROP POLICY IF EXISTS "Developers can manage all invitations" ON public.invitations;

CREATE POLICY "Developers can manage all invitations"
ON public.invitations FOR ALL
USING (has_role(auth.uid(), 'developer'))
WITH CHECK (has_role(auth.uid(), 'developer'));

-- Password reset requests policies
DROP POLICY IF EXISTS "Developers can view owner password reset requests" ON public.password_reset_requests;
DROP POLICY IF EXISTS "Owners can view tenant and manager password reset requests" ON public.password_reset_requests;

CREATE POLICY "Developers can view owner password reset requests"
ON public.password_reset_requests FOR SELECT
USING (has_role(auth.uid(), 'developer') AND user_role = 'owner'::app_role);

CREATE POLICY "Owners can view tenant and manager password reset requests"
ON public.password_reset_requests FOR SELECT
USING (has_role(auth.uid(), 'owner') AND user_role = ANY (ARRAY['tenant'::app_role, 'manager'::app_role]));