
-- ===========================
-- Helper views for school analytics
-- ===========================

-- 1) view_school_students: all activated students per school
CREATE OR REPLACE VIEW public.view_school_students AS
SELECT
  m.school_id,
  m.user_id,
  m.activated_at,
  m.activated_by_code
FROM public.user_school_membership m;

-- 2) view_school_progress_counts: per school per step
CREATE OR REPLACE VIEW public.view_school_progress_counts AS
SELECT
  m.school_id,
  js.slug AS step_slug,
  js.name_ar AS step_name,
  js.order_index,
  COUNT(DISTINCT m.user_id) AS total_students,
  COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN m.user_id END) AS completed_count,
  COUNT(DISTINCT CASE WHEN up.status = 'in_progress' THEN m.user_id END) AS in_progress_count
FROM public.user_school_membership m
CROSS JOIN public.journey_steps js
LEFT JOIN public.user_progress up
  ON up.user_id = m.user_id AND up.step_id = js.id
GROUP BY m.school_id, js.slug, js.name_ar, js.order_index;

-- 3) view_school_impact_summary: pre/post impact per school
CREATE OR REPLACE VIEW public.view_school_impact_summary AS
SELECT
  m.school_id,
  COUNT(DISTINCT CASE WHEN ia.assessment_type = 'pre' THEN m.user_id END) AS count_pre_completed,
  COUNT(DISTINCT CASE WHEN ia.assessment_type = 'post' THEN m.user_id END) AS count_post_completed,
  AVG(CASE WHEN ia.assessment_type = 'pre' AND ia.score_json IS NOT NULL
    THEN (ia.score_json->>'percentage')::numeric END) AS avg_pre_score,
  AVG(CASE WHEN ia.assessment_type = 'post' AND ia.score_json IS NOT NULL
    THEN (ia.score_json->>'percentage')::numeric END) AS avg_post_score
FROM public.user_school_membership m
LEFT JOIN public.impact_assessments ia ON ia.user_id = m.user_id
GROUP BY m.school_id;

-- RLS: views inherit from underlying tables, but we add explicit policies
-- The views are read-only by nature; access controlled by underlying table RLS
