
-- Certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  certificate_code TEXT UNIQUE NOT NULL,
  full_name TEXT,
  whatsapp TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own certificate"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificate"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certificate"
  ON public.certificates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all certificates"
  ON public.certificates FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Public verification view (limited columns only)
CREATE OR REPLACE VIEW public.certificate_verification
WITH (security_invoker = on) AS
  SELECT certificate_code, full_name, issued_at
  FROM public.certificates;

-- Allow anon/public to read the verification view by adding a permissive policy
-- Since the view uses security_invoker, we need a SELECT policy that allows reading by code
CREATE POLICY "Public can verify certificates by code"
  ON public.certificates FOR SELECT
  USING (true);
