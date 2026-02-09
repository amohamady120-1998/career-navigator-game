
CREATE TABLE public.simulation_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  major_id TEXT NOT NULL,
  level TEXT NOT NULL,
  timer_seconds INTEGER,
  text_ar TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read simulation_scenarios"
  ON public.simulation_scenarios FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert simulation_scenarios"
  ON public.simulation_scenarios FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update simulation_scenarios"
  ON public.simulation_scenarios FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete simulation_scenarios"
  ON public.simulation_scenarios FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_simulation_scenarios_major ON public.simulation_scenarios(major_id);
CREATE INDEX idx_simulation_scenarios_level ON public.simulation_scenarios(level);
