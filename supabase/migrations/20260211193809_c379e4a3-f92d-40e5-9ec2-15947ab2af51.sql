
CREATE TABLE IF NOT EXISTS public.final_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  share_token TEXT UNIQUE,
  pdf_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.final_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own final report"
  ON public.final_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own final report"
  ON public.final_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own final report"
  ON public.final_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all final reports"
  ON public.final_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read by share token"
  ON public.final_reports FOR SELECT
  USING (share_token IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_id UUID REFERENCES public.final_reports(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shares"
  ON public.report_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shares"
  ON public.report_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all shares"
  ON public.report_shares FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read by share token"
  ON public.report_shares FOR SELECT
  USING (share_token IS NOT NULL);
