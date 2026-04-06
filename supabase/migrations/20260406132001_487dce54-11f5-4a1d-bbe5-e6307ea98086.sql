
-- 1. has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. can_manage_property
CREATE OR REPLACE FUNCTION public.can_manage_property(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_properties
    WHERE manager_id = _user_id
      AND (property_id = _property_id OR can_manage_all = true)
  )
$$;

-- 4. can_manage_property_as_agent
CREATE OR REPLACE FUNCTION public.can_manage_property_as_agent(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_properties
    WHERE agent_id = _user_id
      AND (property_id = _property_id OR can_manage_all = true)
  )
$$;

-- 5. generate_invitation_credentials (no pgcrypto - store md5 hash instead)
CREATE OR REPLACE FUNCTION public.generate_invitation_credentials(
  invitation_email text,
  invitation_role text,
  invitation_property_id uuid DEFAULT NULL,
  invitation_room_id uuid DEFAULT NULL
)
RETURNS TABLE(email text, temporary_password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password text;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  i int;
BEGIN
  temp_password := '';
  FOR i IN 1..12 LOOP
    temp_password := temp_password || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  INSERT INTO public.invitations (email, role, property_id, room_id, temporary_password, password_hash, invited_by, expires_at)
  VALUES (
    invitation_email,
    invitation_role,
    invitation_property_id,
    invitation_room_id,
    temp_password,
    md5(temp_password),
    auth.uid(),
    now() + interval '7 days'
  );

  RETURN QUERY SELECT invitation_email, temp_password;
END;
$$;

-- 6. handle_invitation_signup
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'))::public.app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 7. generate_rooms_for_property
CREATE OR REPLACE FUNCTION public.generate_rooms_for_property(
  property_id_param uuid,
  property_name_param text,
  total_rooms_param int,
  rent_amount_param numeric
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  i int;
BEGIN
  FOR i IN 1..total_rooms_param LOOP
    INSERT INTO public.rooms (property_id, room_number, rent_amount, is_occupied, rent_status)
    VALUES (
      property_id_param,
      property_name_param || ' - Room ' || i,
      rent_amount_param,
      false,
      'not-paid'
    );
  END LOOP;
END;
$$;

-- 8. get_manager_properties_with_stats
CREATE OR REPLACE FUNCTION public.get_manager_properties_with_stats(manager_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  location text,
  rent_per_room numeric,
  total_rooms int,
  occupied_rooms bigint,
  image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.location,
    p.rent_per_room,
    p.total_rooms,
    (SELECT count(*) FROM public.rooms r WHERE r.property_id = p.id AND r.is_occupied = true) as occupied_rooms,
    p.image_url
  FROM public.properties p
  INNER JOIN public.manager_properties mp ON mp.property_id = p.id OR mp.can_manage_all = true
  WHERE mp.manager_id = manager_user_id
  GROUP BY p.id, p.name, p.location, p.rent_per_room, p.total_rooms, p.image_url;
$$;

-- 9. get_agent_properties_with_stats
CREATE OR REPLACE FUNCTION public.get_agent_properties_with_stats(agent_user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  location text,
  rent_per_room numeric,
  total_rooms int,
  occupied_rooms bigint,
  image_url text,
  total_collected numeric,
  pending_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.location,
    p.rent_per_room,
    p.total_rooms,
    (SELECT count(*) FROM public.rooms r WHERE r.property_id = p.id AND r.is_occupied = true) as occupied_rooms,
    p.image_url,
    COALESCE((SELECT sum(pay.amount) FROM public.payments pay WHERE pay.property_id = p.id AND pay.status = 'completed'), 0) as total_collected,
    COALESCE((SELECT sum(r2.rent_amount) FROM public.rooms r2 WHERE r2.property_id = p.id AND r2.is_occupied = true AND r2.rent_status = 'not-paid'), 0) as pending_amount
  FROM public.properties p
  INNER JOIN public.agent_properties ap ON ap.property_id = p.id OR ap.can_manage_all = true
  WHERE ap.agent_id = agent_user_id
  GROUP BY p.id, p.name, p.location, p.rent_per_room, p.total_rooms, p.image_url;
$$;

-- Create trigger for handle_invitation_signup on auth.users if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_invitation_signup();
  END IF;
END;
$$;

-- Create updated_at triggers
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['properties', 'rooms', 'profiles', 'payments', 'payment_reminders', 'lease_documents']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_' || tbl || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END;
$$;
