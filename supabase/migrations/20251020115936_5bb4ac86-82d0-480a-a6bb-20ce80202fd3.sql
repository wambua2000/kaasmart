-- Create indexes for performance optimization

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON public.rooms(tenant_id);

-- Index for property owner lookups  
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);

-- Composite index for manager property assignments
CREATE INDEX IF NOT EXISTS idx_manager_properties_lookup 
ON public.manager_properties(manager_id, property_id);

-- Create optimized RPC function for manager dashboard
CREATE OR REPLACE FUNCTION public.get_manager_properties_with_stats(manager_user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  location TEXT,
  rent_per_room NUMERIC,
  total_rooms INTEGER,
  image_url TEXT,
  occupied_rooms BIGINT
)
LANGUAGE SQL
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
    p.image_url,
    COUNT(CASE WHEN r.is_occupied = true THEN 1 END) as occupied_rooms
  FROM properties p
  INNER JOIN manager_properties mp ON (mp.can_manage_all = true OR mp.property_id = p.id)
  LEFT JOIN rooms r ON r.property_id = p.id
  WHERE mp.manager_id = manager_user_id
  GROUP BY p.id, p.name, p.location, p.rent_per_room, p.total_rooms, p.image_url
  ORDER BY p.name;
$$;