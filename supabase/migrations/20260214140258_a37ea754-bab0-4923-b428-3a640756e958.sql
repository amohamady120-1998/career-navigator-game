-- Remove the overly permissive anon policy we just added
DROP POLICY IF EXISTS "Public can verify via view" ON public.certificates;

-- Recreate view WITHOUT security_invoker (default = security_definer behavior)
-- This means the view runs with owner privileges and only exposes the 3 safe columns
DROP VIEW IF EXISTS public.certificate_verification;

CREATE VIEW public.certificate_verification AS
SELECT certificate_code, full_name, issued_at
FROM public.certificates;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.certificate_verification TO anon, authenticated;