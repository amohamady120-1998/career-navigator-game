
-- Parents can read linked child holland results
CREATE POLICY "Parents can read linked child holland results"
ON public.holland_results FOR SELECT
USING (EXISTS (
  SELECT 1 FROM parent_child_links
  WHERE parent_child_links.parent_user_id = auth.uid()
    AND parent_child_links.child_user_id = holland_results.user_id
));

-- Parents can read linked child impact assessments
CREATE POLICY "Parents can read linked child impact assessments"
ON public.impact_assessments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM parent_child_links
  WHERE parent_child_links.parent_user_id = auth.uid()
    AND parent_child_links.child_user_id = impact_assessments.user_id
));

-- Institutions can read linked student impact assessments
CREATE POLICY "Institutions can read linked student impact assessments"
ON public.impact_assessments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM institution_student_links
  WHERE institution_student_links.institution_user_id = auth.uid()
    AND institution_student_links.student_user_id = impact_assessments.user_id
));

-- Parents can read linked child major explore responses
CREATE POLICY "Parents can read linked child explore responses"
ON public.major_explore_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM parent_child_links
  WHERE parent_child_links.parent_user_id = auth.uid()
    AND parent_child_links.child_user_id = major_explore_responses.user_id
));

-- Institutions can read linked student major explore responses
CREATE POLICY "Institutions can read linked student explore responses"
ON public.major_explore_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM institution_student_links
  WHERE institution_student_links.institution_user_id = auth.uid()
    AND institution_student_links.student_user_id = major_explore_responses.user_id
));

-- Parents can read linked child simulation responses
CREATE POLICY "Parents can read linked child simulation responses"
ON public.simulation_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM parent_child_links
  WHERE parent_child_links.parent_user_id = auth.uid()
    AND parent_child_links.child_user_id = simulation_responses.user_id
));

-- Institutions can read linked student simulation responses
CREATE POLICY "Institutions can read linked student simulation responses"
ON public.simulation_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM institution_student_links
  WHERE institution_student_links.institution_user_id = auth.uid()
    AND institution_student_links.student_user_id = simulation_responses.user_id
));

-- Parents can read linked child certificates
CREATE POLICY "Parents can read linked child certificates"
ON public.certificates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM parent_child_links
  WHERE parent_child_links.parent_user_id = auth.uid()
    AND parent_child_links.child_user_id = certificates.user_id
));

-- Institutions can read linked student certificates
CREATE POLICY "Institutions can read linked student certificates"
ON public.certificates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM institution_student_links
  WHERE institution_student_links.institution_user_id = auth.uid()
    AND institution_student_links.student_user_id = certificates.user_id
));
