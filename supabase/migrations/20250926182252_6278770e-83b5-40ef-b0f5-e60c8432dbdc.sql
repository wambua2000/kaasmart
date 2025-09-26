-- Add tenant information to rooms table for persistence
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_email TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_phone TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_date_of_entry DATE;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS rent_status TEXT DEFAULT 'not-paid';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_accessories TEXT[];
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS tenant_notes TEXT;

-- Create messages table for property owner to tenant communications
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Property owners can manage messages for their properties" 
ON public.messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = messages.property_id 
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Managers can view messages for properties they manage" 
ON public.messages 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'manager'::app_role
  AND EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = messages.property_id
  )
);

CREATE POLICY "Tenants can view their own messages" 
ON public.messages 
FOR SELECT 
USING (tenant_id = auth.uid());

-- Add trigger for updating messages timestamps
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();