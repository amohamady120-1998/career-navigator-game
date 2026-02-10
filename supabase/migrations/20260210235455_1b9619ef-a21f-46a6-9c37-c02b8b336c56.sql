
-- Promo Codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(50) NOT NULL UNIQUE,
  discount_percentage int NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert promo codes"
  ON public.promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System Settings table
CREATE TABLE public.system_settings (
  setting_key varchar(100) PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read system settings"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert system settings"
  ON public.system_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system settings"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system settings"
  ON public.system_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default system settings
INSERT INTO public.system_settings (setting_key, is_enabled) VALUES
  ('show_videos', true),
  ('allow_registration', true),
  ('show_simulation', true),
  ('show_certificate', true);
