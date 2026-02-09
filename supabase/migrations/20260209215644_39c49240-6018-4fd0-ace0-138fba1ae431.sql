
-- Create parent_child_links table
CREATE TABLE public.parent_child_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  child_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, child_user_id)
);

-- Enable RLS
ALTER TABLE public.parent_child_links ENABLE ROW LEVEL SECURITY;

-- Parents can read their own links
CREATE POLICY "Parents can read own links"
  ON public.parent_child_links
  FOR SELECT
  USING (auth.uid() = parent_user_id);

-- Parents can insert own links
CREATE POLICY "Parents can insert own links"
  ON public.parent_child_links
  FOR INSERT
  WITH CHECK (auth.uid() = parent_user_id);

-- Parents can delete own links
CREATE POLICY "Parents can delete own links"
  ON public.parent_child_links
  FOR DELETE
  USING (auth.uid() = parent_user_id);

-- Allow parents to read child's progress (read-only)
CREATE POLICY "Parents can read linked child progress"
  ON public.user_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_links
      WHERE parent_user_id = auth.uid()
        AND child_user_id = user_progress.user_id
    )
  );

-- Allow parents to read linked child's profile name
CREATE POLICY "Parents can read linked child profile"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_links
      WHERE parent_user_id = auth.uid()
        AND child_user_id = profiles.user_id
    )
  );
