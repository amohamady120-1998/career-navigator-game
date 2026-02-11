
-- Create consultation_requests table
CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT,
  whatsapp TEXT NOT NULL,
  consultation_type TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  report_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_consultation_status ON public.consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_created ON public.consultation_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- Students can insert their own requests
CREATE POLICY "Students can insert own consultation"
ON public.consultation_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Students can read their own requests
CREATE POLICY "Students can read own consultation"
ON public.consultation_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all consultations
CREATE POLICY "Admins can read all consultations"
ON public.consultation_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all consultations
CREATE POLICY "Admins can update all consultations"
ON public.consultation_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
