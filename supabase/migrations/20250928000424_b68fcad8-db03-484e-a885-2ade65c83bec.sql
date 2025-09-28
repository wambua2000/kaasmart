-- Add foreign key constraints for better data integrity
ALTER TABLE public.lease_documents 
ADD CONSTRAINT fk_lease_documents_property_id 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.lease_documents 
ADD CONSTRAINT fk_lease_documents_room_id 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Update RLS policies to ensure managers can view lease documents for properties they manage
DROP POLICY IF EXISTS "Property managers can view all lease documents" ON public.lease_documents;

CREATE POLICY "Property managers can view lease documents for managed properties" 
ON public.lease_documents 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'manager' AND 
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = lease_documents.property_id
  )
);

-- Ensure managers can also view lease documents via storage
DROP POLICY IF EXISTS "Property managers can view all lease documents" ON storage.objects;

CREATE POLICY "Property managers can view lease documents for managed properties" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'leases' AND 
  get_user_role(auth.uid()) = 'manager' AND 
  EXISTS (
    SELECT 1 FROM public.lease_documents ld
    JOIN public.properties p ON p.id = ld.property_id
    WHERE ld.file_path = storage.objects.name
  )
);