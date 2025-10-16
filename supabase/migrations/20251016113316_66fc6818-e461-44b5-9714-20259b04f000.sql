-- Insert properties with the existing owner
DO $$
DECLARE
  owner_uuid UUID := 'cc15058b-8fc9-43f5-aa64-31afbf7e413e'::UUID;
  white_house_id UUID;
  yellow_house_id UUID;
  green_house_id UUID;
  skyline_id UUID;
  african_complex_id UUID;
BEGIN
  -- Insert White House
  INSERT INTO public.properties (id, name, location, total_rooms, rent_per_room, owner_id, image_url)
  VALUES (
    gen_random_uuid(),
    'White House',
    'Nairobi, Kenya',
    12,
    8000,
    owner_uuid,
    '/src/assets/white-house.jpg'
  )
  RETURNING id INTO white_house_id;
  
  -- Generate rooms for White House
  PERFORM generate_rooms_for_property(white_house_id, 'White House', 12, 8000);
  
  -- Insert Yellow House
  INSERT INTO public.properties (id, name, location, total_rooms, rent_per_room, owner_id, image_url)
  VALUES (
    gen_random_uuid(),
    'Yellow House',
    'Nairobi, Kenya',
    10,
    7500,
    owner_uuid,
    '/src/assets/yellow-house.jpg'
  )
  RETURNING id INTO yellow_house_id;
  
  -- Generate rooms for Yellow House
  PERFORM generate_rooms_for_property(yellow_house_id, 'Yellow House', 10, 7500);
  
  -- Insert Green House
  INSERT INTO public.properties (id, name, location, total_rooms, rent_per_room, owner_id, image_url)
  VALUES (
    gen_random_uuid(),
    'Green House',
    'Nairobi, Kenya',
    8,
    9000,
    owner_uuid,
    '/src/assets/green-house.jpg'
  )
  RETURNING id INTO green_house_id;
  
  -- Generate rooms for Green House
  PERFORM generate_rooms_for_property(green_house_id, 'Green House', 8, 9000);
  
  -- Insert Skyline Apartment
  INSERT INTO public.properties (id, name, location, total_rooms, rent_per_room, owner_id, image_url)
  VALUES (
    gen_random_uuid(),
    'Skyline Apartment',
    'Nairobi, Kenya',
    15,
    12000,
    owner_uuid,
    '/src/assets/skyline-apartment.jpg'
  )
  RETURNING id INTO skyline_id;
  
  -- Generate rooms for Skyline Apartment
  PERFORM generate_rooms_for_property(skyline_id, 'Skyline Apartment', 15, 12000);
  
  -- Insert African Apartment Complex
  INSERT INTO public.properties (id, name, location, total_rooms, rent_per_room, owner_id, image_url)
  VALUES (
    gen_random_uuid(),
    'African Apartment Complex',
    'Nairobi, Kenya',
    20,
    10000,
    owner_uuid,
    '/src/assets/african-apartment-complex.jpg'
  )
  RETURNING id INTO african_complex_id;
  
  -- Generate rooms for African Apartment Complex
  PERFORM generate_rooms_for_property(african_complex_id, 'African Apartment Complex', 20, 10000);
  
END $$;