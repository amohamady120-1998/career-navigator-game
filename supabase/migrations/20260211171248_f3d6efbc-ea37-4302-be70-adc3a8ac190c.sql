CREATE TABLE IF NOT EXISTS public.majors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.major_explore_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL CHECK (stage_key IN ('year1', 'year2', 'year3', 'year4', 'post_grad')),
  stage_title_ar TEXT NOT NULL,
  reality_snapshot_ar TEXT NOT NULL,
  challenges_ar JSONB NOT NULL DEFAULT '[]'::jsonb,
  scenario_prompt_ar TEXT NOT NULL,
  scenario_options_ar JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(major_id, stage_key)
);

CREATE TABLE IF NOT EXISTS public.major_explore_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  major_id UUID REFERENCES public.majors(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  comfort_level TEXT NOT NULL CHECK (comfort_level IN ('very_comfortable', 'ok', 'hesitant', 'not_comfortable')),
  scenario_choice_index INT NOT NULL,
  time_spent_sec INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_explore_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_explore_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read majors" ON public.majors FOR SELECT USING (true);

CREATE POLICY "Admins can insert majors" ON public.majors FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update majors" ON public.majors FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete majors" ON public.majors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read sections" ON public.major_explore_sections FOR SELECT USING (true);

CREATE POLICY "Admins can insert sections" ON public.major_explore_sections FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sections" ON public.major_explore_sections FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sections" ON public.major_explore_sections FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can read own responses" ON public.major_explore_responses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON public.major_explore_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON public.major_explore_responses FOR UPDATE USING (auth.uid() = user_id);
