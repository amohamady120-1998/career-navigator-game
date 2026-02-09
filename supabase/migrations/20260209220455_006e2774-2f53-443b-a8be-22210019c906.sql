
-- Update RPC to use ILIKE for flexible school name matching
CREATE OR REPLACE FUNCTION public.link_students_by_school(school_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_type text;
  _linked_count integer;
BEGIN
  -- Verify caller is an institution
  SELECT user_type INTO _caller_type
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF _caller_type IS NULL OR _caller_type != 'institution' THEN
    RAISE EXCEPTION 'Only institution users can link students by school';
  END IF;

  -- Bulk-insert links for all students with matching school_name (case-insensitive)
  WITH inserted AS (
    INSERT INTO public.institution_student_links (institution_user_id, student_user_id)
    SELECT auth.uid(), p.user_id
    FROM public.profiles p
    WHERE p.school_name ILIKE link_students_by_school.school_name
      AND p.user_type = 'student'
    ON CONFLICT (institution_user_id, student_user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO _linked_count FROM inserted;

  RETURN _linked_count;
END;
$$;
