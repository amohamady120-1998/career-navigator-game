
-- Create institution_student_links table
CREATE TABLE public.institution_student_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_user_id uuid NOT NULL,
  student_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_user_id, student_user_id)
);

-- Enable RLS
ALTER TABLE public.institution_student_links ENABLE ROW LEVEL SECURITY;

-- Institution users can read their own links
CREATE POLICY "Institutions can read own links"
ON public.institution_student_links
FOR SELECT
USING (auth.uid() = institution_user_id);

-- Institution users can insert their own links
CREATE POLICY "Institutions can insert own links"
ON public.institution_student_links
FOR INSERT
WITH CHECK (auth.uid() = institution_user_id);

-- Institution users can delete their own links
CREATE POLICY "Institutions can delete own links"
ON public.institution_student_links
FOR DELETE
USING (auth.uid() = institution_user_id);

-- Allow institution users to read progress of linked students
CREATE POLICY "Institutions can read linked student progress"
ON public.user_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.institution_student_links
    WHERE institution_user_id = auth.uid()
    AND student_user_id = user_progress.user_id
  )
);

-- Allow institution users to read linked student profiles
CREATE POLICY "Institutions can read linked student profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.institution_student_links
    WHERE institution_user_id = auth.uid()
    AND student_user_id = profiles.user_id
  )
);

-- Allow institution users to read holland_results of linked students
CREATE POLICY "Institutions can read linked student holland results"
ON public.holland_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.institution_student_links
    WHERE institution_user_id = auth.uid()
    AND student_user_id = holland_results.user_id
  )
);

-- Create RPC to link students by school name
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

  -- Bulk-insert links for all students with matching school_name
  WITH inserted AS (
    INSERT INTO public.institution_student_links (institution_user_id, student_user_id)
    SELECT auth.uid(), p.user_id
    FROM public.profiles p
    WHERE p.school_name = link_students_by_school.school_name
      AND p.user_type = 'student'
    ON CONFLICT (institution_user_id, student_user_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO _linked_count FROM inserted;

  RETURN _linked_count;
END;
$$;
