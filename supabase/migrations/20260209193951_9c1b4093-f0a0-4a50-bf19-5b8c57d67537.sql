
-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for role-based access
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Holland codes reference table
CREATE TABLE public.holland_codes (
  code text PRIMARY KEY,
  description text,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  career_paths jsonb DEFAULT '[]'::jsonb,
  recommended_majors jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.holland_codes ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can read holland_codes" ON public.holland_codes
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert holland_codes" ON public.holland_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update holland_codes" ON public.holland_codes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete holland_codes" ON public.holland_codes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
