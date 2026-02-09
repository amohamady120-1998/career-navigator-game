
-- Scoring function: calculates RIASEC scores from user answers
CREATE OR REPLACE FUNCTION public.calculate_holland_scores(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(code, score) INTO result
  FROM (
    SELECT q.riasec_code AS code, COUNT(*) AS score
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE a.user_id = _user_id
      AND q.category = 'holland'
      AND a.answer_value = 'yes'
      AND q.riasec_code IS NOT NULL
    GROUP BY q.riasec_code
  ) sub;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to get top 3 RIASEC letters as a code string
CREATE OR REPLACE FUNCTION public.get_holland_code(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  top_code text;
BEGIN
  SELECT string_agg(code, '' ORDER BY score DESC, code ASC) INTO top_code
  FROM (
    SELECT code, score
    FROM jsonb_each_text(calculate_holland_scores(_user_id)) AS x(code, score)
    ORDER BY score::int DESC, code ASC
    LIMIT 3
  ) sub;
  
  RETURN COALESCE(top_code, '');
END;
$$;

-- Holland results table to store computed results
CREATE TABLE public.holland_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  top_code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.holland_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own results" ON public.holland_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.holland_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON public.holland_results FOR UPDATE USING (auth.uid() = user_id);
