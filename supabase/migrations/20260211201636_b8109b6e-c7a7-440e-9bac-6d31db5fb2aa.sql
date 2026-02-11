-- Create user_consents table
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own consent"
ON public.user_consents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own consent"
ON public.user_consents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own consent"
ON public.user_consents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all consents"
ON public.user_consents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);