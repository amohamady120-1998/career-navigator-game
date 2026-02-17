
-- 1) parent_activation_tokens table
CREATE TABLE IF NOT EXISTS public.parent_activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  used_by_user_id UUID,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_parent_activation_token_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'used', 'expired', 'revoked') THEN
    RAISE EXCEPTION 'status must be active, used, expired, or revoked';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pat_status
BEFORE INSERT OR UPDATE ON public.parent_activation_tokens
FOR EACH ROW EXECUTE FUNCTION public.validate_parent_activation_token_status();

CREATE INDEX IF NOT EXISTS idx_pat_parent ON public.parent_activation_tokens(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_pat_status ON public.parent_activation_tokens(status);
CREATE INDEX IF NOT EXISTS idx_pat_token ON public.parent_activation_tokens(token);

-- 2) parent_notifications table
CREATE TABLE IF NOT EXISTS public.parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validation trigger for type
CREATE OR REPLACE FUNCTION public.validate_parent_notification_type()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('child_activated') THEN
    RAISE EXCEPTION 'type must be child_activated';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pn_type
BEFORE INSERT OR UPDATE ON public.parent_notifications
FOR EACH ROW EXECUTE FUNCTION public.validate_parent_notification_type();

CREATE INDEX IF NOT EXISTS idx_parent_notif_parent ON public.parent_notifications(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_notif_created ON public.parent_notifications(created_at DESC);

-- 3) Add index to existing parent_child_links
CREATE INDEX IF NOT EXISTS idx_pcl_parent ON public.parent_child_links(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_pcl_child ON public.parent_child_links(child_user_id);

-- 4) RLS for parent_activation_tokens
ALTER TABLE public.parent_activation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY pat_parent_select_own ON public.parent_activation_tokens
FOR SELECT TO authenticated USING (auth.uid() = parent_user_id);

CREATE POLICY pat_parent_insert_own ON public.parent_activation_tokens
FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY pat_parent_update_own ON public.parent_activation_tokens
FOR UPDATE TO authenticated
USING (auth.uid() = parent_user_id)
WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY pat_admin_all ON public.parent_activation_tokens
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) RLS for parent_notifications
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY pn_parent_select ON public.parent_notifications
FOR SELECT TO authenticated USING (auth.uid() = parent_user_id);

CREATE POLICY pn_parent_update ON public.parent_notifications
FOR UPDATE TO authenticated
USING (auth.uid() = parent_user_id)
WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY pn_admin_all ON public.parent_notifications
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) RPC: consume_parent_activation_token
CREATE OR REPLACE FUNCTION public.consume_parent_activation_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_row RECORD;
  v_child_id UUID;
BEGIN
  v_child_id := auth.uid();
  IF v_child_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح');
  END IF;

  -- Find and lock the token
  SELECT * INTO v_token_row
  FROM parent_activation_tokens
  WHERE token = p_token
  FOR UPDATE;

  IF v_token_row IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'الرابط غير صالح');
  END IF;

  IF v_token_row.status != 'active' THEN
    RETURN json_build_object('success', false, 'error',
      CASE v_token_row.status
        WHEN 'used' THEN 'تم استخدام هذا الرابط مسبقاً'
        WHEN 'expired' THEN 'انتهت صلاحية هذا الرابط'
        WHEN 'revoked' THEN 'تم إلغاء هذا الرابط'
        ELSE 'الرابط غير صالح'
      END
    );
  END IF;

  IF v_token_row.expires_at < NOW() THEN
    UPDATE parent_activation_tokens SET status = 'expired' WHERE id = v_token_row.id;
    RETURN json_build_object('success', false, 'error', 'انتهت صلاحية هذا الرابط');
  END IF;

  -- Mark token as used
  UPDATE parent_activation_tokens
  SET status = 'used', used_by_user_id = v_child_id, used_at = NOW()
  WHERE id = v_token_row.id;

  -- Upsert parent_child_links
  INSERT INTO parent_child_links (parent_user_id, child_user_id)
  VALUES (v_token_row.parent_user_id, v_child_id)
  ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

  -- Insert parent notification
  INSERT INTO parent_notifications (parent_user_id, type, payload)
  VALUES (
    v_token_row.parent_user_id,
    'child_activated',
    jsonb_build_object('child_user_id', v_child_id, 'used_at', NOW()::text)
  );

  RETURN json_build_object(
    'success', true,
    'parent_user_id', v_token_row.parent_user_id,
    'child_user_id', v_child_id
  );
END;
$$;
