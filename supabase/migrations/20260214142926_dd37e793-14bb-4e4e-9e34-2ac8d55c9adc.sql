
-- Fix 1: Email Enumeration - Make link_student_by_email return consistent errors
CREATE OR REPLACE FUNCTION public.link_student_by_email(student_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _student_id uuid;
  _caller_type text;
BEGIN
  -- Verify caller is a parent
  SELECT user_type INTO _caller_type
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF _caller_type IS NULL OR _caller_type != 'parent' THEN
    RAISE EXCEPTION 'Only parents can link students';
  END IF;

  -- Look up the student's user id from auth.users by email
  SELECT id INTO _student_id
  FROM auth.users
  WHERE email = lower(student_email);

  -- Return FALSE for ALL failure cases without distinguishing reason
  IF _student_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _student_id AND user_type = 'student'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Insert the link (ignore if already exists)
  INSERT INTO public.parent_child_links (parent_user_id, child_user_id)
  VALUES (auth.uid(), _student_id)
  ON CONFLICT (parent_user_id, child_user_id) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Fix 2: Server-side rate limiting for consultation requests
CREATE OR REPLACE FUNCTION public.check_consultation_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM consultation_requests
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '10 minutes';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 3 consultation requests per 10 minutes';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consultation_rate_limit
BEFORE INSERT ON public.consultation_requests
FOR EACH ROW EXECUTE FUNCTION public.check_consultation_rate_limit();
