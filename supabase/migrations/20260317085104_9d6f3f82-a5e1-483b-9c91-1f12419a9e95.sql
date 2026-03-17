CREATE TABLE public.free_account_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  property_name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.free_account_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.free_account_signups
  FOR INSERT TO anon WITH CHECK (true);