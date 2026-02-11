
-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_name TEXT NOT NULL,
  event_props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_analytics"
ON public.analytics_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_read_all_analytics"
ON public.analytics_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- App error logs table
CREATE TABLE IF NOT EXISTS public.app_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  route TEXT,
  error_message TEXT NOT NULL,
  stack TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_error_created ON public.app_error_logs(created_at DESC);

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_errors"
ON public.app_error_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anon_insert_errors"
ON public.app_error_logs FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "admin_read_all_errors"
ON public.app_error_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Rate limit entries
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key, window_start)
);

ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_rate_limits"
ON public.rate_limit_entries FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_read_all_rate_limits"
ON public.rate_limit_entries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
