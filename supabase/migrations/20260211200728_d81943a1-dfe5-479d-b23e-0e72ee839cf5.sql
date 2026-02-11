
-- Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  email_to TEXT,
  webhook_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_notification_settings"
ON public.notification_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert defaults
INSERT INTO public.notification_settings (key, email_to, is_enabled) VALUES
  ('consultation_new', NULL, true),
  ('school_activation', NULL, true)
ON CONFLICT (key) DO NOTHING;

-- Notifications log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_email BOOLEAN DEFAULT false,
  sent_webhook BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_notifications_log"
ON public.notifications_log
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger function to call edge function on consultation insert
CREATE OR REPLACE FUNCTION public.notify_consultation_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _payload jsonb;
BEGIN
  _payload := jsonb_build_object(
    'event_key', 'consultation_new',
    'user_name', NEW.user_name,
    'whatsapp', NEW.whatsapp,
    'consultation_type', NEW.consultation_type,
    'notes', NEW.notes,
    'created_at', NEW.created_at
  );

  -- Log will be created by edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := _payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block insert if notification fails
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_consultation_new
AFTER INSERT ON public.consultation_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_consultation_insert();

-- Trigger function for school activation
CREATE OR REPLACE FUNCTION public.notify_school_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _school_name text;
  _payload jsonb;
BEGIN
  SELECT name INTO _school_name FROM public.schools WHERE id = NEW.school_id;
  
  _payload := jsonb_build_object(
    'event_key', 'school_activation',
    'school_id', NEW.school_id,
    'school_name', COALESCE(_school_name, ''),
    'user_id', NEW.user_id,
    'activated_at', NEW.activated_at,
    'code', COALESCE(NEW.activated_by_code, '')
  );

  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := _payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_school_activation
AFTER INSERT ON public.user_school_membership
FOR EACH ROW
EXECUTE FUNCTION public.notify_school_activation();
