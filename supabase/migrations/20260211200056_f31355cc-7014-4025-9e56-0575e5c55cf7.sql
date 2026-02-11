
-- Fix security definer views by setting them to security_invoker
ALTER VIEW public.view_school_students SET (security_invoker = on);
ALTER VIEW public.view_school_progress_counts SET (security_invoker = on);
ALTER VIEW public.view_school_impact_summary SET (security_invoker = on);
