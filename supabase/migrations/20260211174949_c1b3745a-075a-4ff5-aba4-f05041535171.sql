
-- 1. Index on existing majors table
CREATE INDEX IF NOT EXISTS idx_majors_active ON majors(is_active);

-- 2. Holland Major Mapping
CREATE TABLE IF NOT EXISTS holland_major_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holland_code TEXT NOT NULL CHECK (char_length(holland_code) BETWEEN 2 AND 3),
  major_id UUID REFERENCES majors(id) ON DELETE CASCADE,
  rank_order INT NOT NULL CHECK (rank_order IN (1, 2, 3)),
  weight NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(holland_code, rank_order),
  UNIQUE(holland_code, major_id)
);

ALTER TABLE holland_major_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read holland_major_map" ON holland_major_map FOR SELECT USING (true);
CREATE POLICY "Admins can insert holland_major_map" ON holland_major_map FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update holland_major_map" ON holland_major_map FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete holland_major_map" ON holland_major_map FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 3. Student Shortlist
CREATE TABLE IF NOT EXISTS student_shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  major_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ranking_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE student_shortlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shortlist" ON student_shortlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shortlist" ON student_shortlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shortlist" ON student_shortlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Parents can read linked child shortlist" ON student_shortlist FOR SELECT USING (EXISTS (SELECT 1 FROM parent_child_links WHERE parent_user_id = auth.uid() AND child_user_id = student_shortlist.user_id));
CREATE POLICY "Institutions can read linked student shortlist" ON student_shortlist FOR SELECT USING (EXISTS (SELECT 1 FROM institution_student_links WHERE institution_user_id = auth.uid() AND student_user_id = student_shortlist.user_id));
CREATE POLICY "Admins can read all shortlists" ON student_shortlist FOR SELECT USING (has_role(auth.uid(), 'admin'));
