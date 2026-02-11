
-- Create school_admins table to link users to schools
CREATE TABLE IF NOT EXISTS public.school_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'school_admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT school_admins_role_check CHECK (role IN ('school_admin', 'school_viewer'))
);

-- Enable RLS
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;

-- School user can SELECT only their own row
CREATE POLICY "school_admins_select_own"
ON public.school_admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can manage all
CREATE POLICY "school_admins_admin_all"
ON public.school_admins
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
