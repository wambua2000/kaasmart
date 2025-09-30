-- Create password reset requests table
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_role app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  new_password TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Property owners can view and manage all password reset requests
CREATE POLICY "Owners can manage password reset requests"
ON public.password_reset_requests
FOR ALL
USING (get_user_role_safe(auth.uid()) = 'owner'::app_role);

-- Developers can view all requests
CREATE POLICY "Developers can view password reset requests"
ON public.password_reset_requests
FOR SELECT
USING (get_user_role_safe(auth.uid()) = 'developer'::app_role);

-- Anyone can insert a password reset request (for forgot password feature)
CREATE POLICY "Anyone can request password reset"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_password_reset_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_email ON public.password_reset_requests(email);