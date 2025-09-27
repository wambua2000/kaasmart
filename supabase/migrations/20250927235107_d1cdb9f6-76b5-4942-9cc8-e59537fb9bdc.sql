-- Create storage bucket for lease documents
INSERT INTO storage.buckets (id, name, public) VALUES ('leases', 'leases', false);

-- Create policies for lease uploads
CREATE POLICY "Tenants can upload their own lease documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'leases' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Tenants can view their own lease documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'leases' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Property owners can view all lease documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'leases' AND get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Property managers can view all lease documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'leases' AND get_user_role(auth.uid()) = 'manager');

-- Create a table to track lease documents with metadata
CREATE TABLE public.lease_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  room_id UUID,
  property_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lease_documents table
ALTER TABLE public.lease_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for lease_documents table
CREATE POLICY "Tenants can manage their own lease documents" 
ON public.lease_documents 
FOR ALL 
USING (tenant_id = auth.uid());

CREATE POLICY "Property owners can view all lease documents" 
ON public.lease_documents 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'owner');

CREATE POLICY "Property managers can view all lease documents" 
ON public.lease_documents 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'manager');

-- Add trigger for updating updated_at
CREATE TRIGGER update_lease_documents_updated_at
BEFORE UPDATE ON public.lease_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();