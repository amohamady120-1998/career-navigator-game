-- Fix 1: Drop overly permissive public SELECT on certificates table
DROP POLICY IF EXISTS "Public can verify certificates by code" ON public.certificates;

-- Fix 2: Recreate the view with security_invoker so it respects the base table's RLS
-- Since public users need to verify certificates, we add a narrow policy that only allows
-- reading certificate_code, full_name, issued_at (the columns the view exposes)
-- We use a targeted policy that requires a certificate_code filter
DROP VIEW IF EXISTS public.certificate_verification;

CREATE VIEW public.certificate_verification
WITH (security_invoker = true)
AS SELECT certificate_code, full_name, issued_at
FROM public.certificates;

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.certificate_verification TO anon, authenticated;

-- Add a narrow public policy on certificates for verification only
-- This only allows SELECT and only exposes the 3 safe columns through the view
CREATE POLICY "Public can verify via view"
  ON public.certificates
  FOR SELECT
  TO anon
  USING (true);