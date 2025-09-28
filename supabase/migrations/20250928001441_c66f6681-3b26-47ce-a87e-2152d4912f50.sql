-- Create a function to generate rooms for a property
CREATE OR REPLACE FUNCTION generate_rooms_for_property(
  property_id_param UUID,
  property_name_param TEXT,
  total_rooms_param INTEGER,
  rent_amount_param NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  room_prefix TEXT;
  i INTEGER;
BEGIN
  -- Determine room prefix based on property name
  CASE property_name_param
    WHEN 'White House' THEN room_prefix := 'white';
    WHEN 'Yellow House' THEN room_prefix := 'yellow';
    WHEN 'Green House' THEN room_prefix := 'green';
    WHEN 'Skyline Apartment' THEN room_prefix := 'skyline';
    ELSE room_prefix := 'room';
  END CASE;

  -- Generate rooms
  FOR i IN 1..total_rooms_param LOOP
    INSERT INTO public.rooms (
      id,
      room_number, 
      property_id, 
      rent_amount, 
      rent_status, 
      is_occupied
    ) VALUES (
      gen_random_uuid(),
      room_prefix || LPAD(i::TEXT, 3, '0'),
      property_id_param,
      rent_amount_param,
      'not-paid',
      false
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;