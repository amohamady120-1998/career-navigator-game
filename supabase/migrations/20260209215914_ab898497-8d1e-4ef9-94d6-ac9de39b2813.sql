
-- Create a secure RPC function that looks up a student by email and links them to the calling parent
CREATE OR REPLACE FUNCTION public.link_student_by_email(student_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  IF _student_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify the matched user is a student
  IF NOT EXISTS (
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
