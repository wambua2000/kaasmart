-- 1. Add owner scoping to manager/agent assignments
ALTER TABLE public.manager_properties ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.agent_properties ADD COLUMN IF NOT EXISTS owner_id uuid;

-- 2. Backfill from the property's owner where a property is assigned
UPDATE public.manager_properties mp
SET owner_id = p.owner_id
FROM public.properties p
WHERE mp.property_id = p.id AND mp.owner_id IS NULL;

UPDATE public.agent_properties ap
SET owner_id = p.owner_id
FROM public.properties p
WHERE ap.property_id = p.id AND ap.owner_id IS NULL;

-- 3. Backfill "manage all" rows from the inviting owner
UPDATE public.manager_properties mp
SET owner_id = mp.assigned_by
WHERE mp.owner_id IS NULL
  AND mp.assigned_by IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.owner_id = mp.assigned_by);

UPDATE public.agent_properties ap
SET owner_id = ap.assigned_by
WHERE ap.owner_id IS NULL
  AND ap.assigned_by IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.owner_id = ap.assigned_by);

-- 4. Backfill remaining rows from another assignment of the same user
UPDATE public.manager_properties mp
SET owner_id = o.owner_id
FROM (SELECT manager_id, max(owner_id::text)::uuid AS owner_id FROM public.manager_properties WHERE owner_id IS NOT NULL GROUP BY manager_id) o
WHERE mp.owner_id IS NULL AND mp.manager_id = o.manager_id;

UPDATE public.agent_properties ap
SET owner_id = o.owner_id
FROM (SELECT agent_id, max(owner_id::text)::uuid AS owner_id FROM public.agent_properties WHERE owner_id IS NOT NULL GROUP BY agent_id) o
WHERE ap.owner_id IS NULL AND ap.agent_id = o.agent_id;

CREATE INDEX IF NOT EXISTS idx_manager_properties_owner ON public.manager_properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_properties_owner ON public.agent_properties(owner_id);

-- 5. Access helpers now scope "manage all" to the inviting owner's portfolio
CREATE OR REPLACE FUNCTION public.get_accessible_property_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.properties WHERE owner_id = _user_id
  UNION
  SELECT property_id FROM public.manager_properties WHERE manager_id = _user_id AND property_id IS NOT NULL
  UNION
  SELECT p.id FROM public.properties p
    WHERE EXISTS (
      SELECT 1 FROM public.manager_properties mp
      WHERE mp.manager_id = _user_id AND mp.can_manage_all = true
        AND mp.owner_id IS NOT NULL AND mp.owner_id = p.owner_id
    )
  UNION
  SELECT property_id FROM public.agent_properties WHERE agent_id = _user_id AND property_id IS NOT NULL
  UNION
  SELECT p.id FROM public.properties p
    WHERE EXISTS (
      SELECT 1 FROM public.agent_properties ap
      WHERE ap.agent_id = _user_id AND ap.can_manage_all = true
        AND ap.owner_id IS NOT NULL AND ap.owner_id = p.owner_id
    )
  UNION
  SELECT r.property_id FROM public.rooms r WHERE r.tenant_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_property(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.manager_properties mp
    LEFT JOIN public.properties p ON p.id = _property_id
    WHERE mp.manager_id = _user_id
      AND (
        mp.property_id = _property_id
        OR (mp.can_manage_all = true AND mp.owner_id IS NOT NULL AND mp.owner_id = p.owner_id)
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_property_as_agent(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_properties ap
    LEFT JOIN public.properties p ON p.id = _property_id
    WHERE ap.agent_id = _user_id
      AND (
        ap.property_id = _property_id
        OR (ap.can_manage_all = true AND ap.owner_id IS NOT NULL AND ap.owner_id = p.owner_id)
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_manager_properties_with_stats(manager_user_id uuid)
RETURNS TABLE(id uuid, name text, location text, rent_per_room numeric, total_rooms integer, occupied_rooms bigint, image_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.name,
    p.location,
    p.rent_per_room,
    p.total_rooms,
    (SELECT count(*) FROM public.rooms r WHERE r.property_id = p.id AND r.is_occupied = true) AS occupied_rooms,
    p.image_url
  FROM public.properties p
  WHERE EXISTS (
    SELECT 1 FROM public.manager_properties mp
    WHERE mp.manager_id = manager_user_id
      AND (
        mp.property_id = p.id
        OR (mp.can_manage_all = true AND mp.owner_id IS NOT NULL AND mp.owner_id = p.owner_id)
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_agent_properties_with_stats(agent_user_id uuid)
RETURNS TABLE(id uuid, name text, location text, rent_per_room numeric, total_rooms integer, occupied_rooms bigint, image_url text, total_collected numeric, pending_amount numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.name,
    p.location,
    p.rent_per_room,
    p.total_rooms,
    (SELECT count(*) FROM public.rooms r WHERE r.property_id = p.id AND r.is_occupied = true) AS occupied_rooms,
    p.image_url,
    COALESCE((SELECT sum(pay.amount) FROM public.payments pay WHERE pay.property_id = p.id AND pay.status = 'completed'), 0) AS total_collected,
    COALESCE((SELECT sum(r2.rent_amount) FROM public.rooms r2 WHERE r2.property_id = p.id AND r2.is_occupied = true AND r2.rent_status = 'not-paid'), 0) AS pending_amount
  FROM public.properties p
  WHERE EXISTS (
    SELECT 1 FROM public.agent_properties ap
    WHERE ap.agent_id = agent_user_id
      AND (
        ap.property_id = p.id
        OR (ap.can_manage_all = true AND ap.owner_id IS NOT NULL AND ap.owner_id = p.owner_id)
      )
  );
$function$;