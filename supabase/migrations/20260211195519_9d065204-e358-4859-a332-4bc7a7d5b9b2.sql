
-- ===========================
-- 1) Create all tables first
-- ===========================
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  seats_total INT NOT NULL,
  seats_used INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_order_id UUID NOT NULL REFERENCES public.school_orders(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by_user_id UUID,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_codes_order ON public.school_codes(school_order_id);
CREATE INDEX IF NOT EXISTS idx_school_codes_used ON public.school_codes(is_used);

CREATE TABLE IF NOT EXISTS public.user_school_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_order_id UUID REFERENCES public.school_orders(id) ON DELETE SET NULL,
  activated_by_code TEXT,
  activated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 2) Validation trigger for school_orders
-- ===========================
CREATE OR REPLACE FUNCTION public.validate_school_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seats_total <= 0 THEN
    RAISE EXCEPTION 'seats_total must be greater than 0';
  END IF;
  IF NEW.status NOT IN ('active', 'paused', 'closed') THEN
    RAISE EXCEPTION 'status must be active, paused, or closed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_school_order
  BEFORE INSERT OR UPDATE ON public.school_orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_school_order();

-- ===========================
-- 3) Enable RLS on all tables
-- ===========================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_school_membership ENABLE ROW LEVEL SECURITY;

-- ===========================
-- 4) RLS policies
-- ===========================

-- schools
CREATE POLICY "Admins can manage schools"
  ON public.schools FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School members can read own school"
  ON public.schools FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_school_membership m
    WHERE m.school_id = schools.id AND m.user_id = auth.uid()
  ));

-- school_orders
CREATE POLICY "Admins can manage school_orders"
  ON public.school_orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School members can read own orders"
  ON public.school_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_school_membership m
    WHERE m.school_id = school_orders.school_id AND m.user_id = auth.uid()
  ));

-- school_codes: only admins
CREATE POLICY "Admins can manage school_codes"
  ON public.school_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- user_school_membership
CREATE POLICY "Admins can manage memberships"
  ON public.user_school_membership FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own membership"
  ON public.user_school_membership FOR SELECT
  USING (auth.uid() = user_id);

-- ===========================
-- 5) Secure activation RPC
-- ===========================
CREATE OR REPLACE FUNCTION public.activate_school_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id UUID;
  v_order_id UUID;
  v_school_id UUID;
  v_school_name TEXT;
  v_seats_total INT;
  v_seats_used INT;
  v_order_status TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح');
  END IF;

  -- Check if user already has a membership
  IF EXISTS (SELECT 1 FROM user_school_membership WHERE user_id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'لديك اشتراك مدرسي مفعل بالفعل');
  END IF;

  -- Find the code
  SELECT sc.id, sc.school_order_id
  INTO v_code_id, v_order_id
  FROM school_codes sc
  WHERE sc.code = p_code AND sc.is_used = false;

  IF v_code_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'الكود غير صحيح أو مستخدم');
  END IF;

  -- Check order status and seats
  SELECT so.school_id, so.seats_total, so.seats_used, so.status
  INTO v_school_id, v_seats_total, v_seats_used, v_order_status
  FROM school_orders so
  WHERE so.id = v_order_id;

  IF v_order_status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'الطلب غير نشط');
  END IF;

  IF v_seats_used >= v_seats_total THEN
    RETURN json_build_object('success', false, 'error', 'تم استنفاد جميع المقاعد');
  END IF;

  SELECT s.name INTO v_school_name FROM schools s WHERE s.id = v_school_id;

  -- Mark code as used
  UPDATE school_codes SET is_used = true, used_by_user_id = v_user_id, used_at = now()
  WHERE id = v_code_id;

  -- Increment seats_used
  UPDATE school_orders SET seats_used = seats_used + 1 WHERE id = v_order_id;

  -- Create membership
  INSERT INTO user_school_membership (user_id, school_id, school_order_id, activated_by_code)
  VALUES (v_user_id, v_school_id, v_order_id, p_code);

  -- Mark user as paid
  UPDATE profiles SET has_paid = true WHERE user_id = v_user_id;

  RETURN json_build_object('success', true, 'school_id', v_school_id, 'school_name', v_school_name);
END;
$$;
