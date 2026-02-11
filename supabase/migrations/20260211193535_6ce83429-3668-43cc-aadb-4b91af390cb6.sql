
CREATE TABLE IF NOT EXISTS public.impact_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('pre','post')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assessment_type)
);

ALTER TABLE public.impact_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assessments"
  ON public.impact_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON public.impact_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON public.impact_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all assessments"
  ON public.impact_assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
