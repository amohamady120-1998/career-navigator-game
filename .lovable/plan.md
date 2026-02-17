

# Comprehensive Journey Audit and Fix Plan

## Bugs Found (8 Critical Issues)

### Bug 1: SimulationStep skips Post-Impact Assessment
**File:** `SimulationStep.tsx` line 484
**Problem:** After simulation summary, the CTA navigates to `/dashboard/report` (the Holland report page), completely skipping the Post-Impact Assessment (`/dashboard/post-impact`).
**Correct flow:** Simulation -> Post-Impact -> Final Report
**Fix:** Change navigation to `/dashboard/post-impact`

### Bug 2: HollandAssessment uses hardcoded step UUID
**File:** `HollandAssessment.tsx` line 9
**Problem:** `HOLLAND_STEP_ID = "0b586437-03db-40c4-8cdc-4f889a322c49"` is hardcoded. If this UUID doesn't match the database, the step never gets marked as completed. All other steps fetch the UUID dynamically.
**Fix:** Fetch the UUID from `journey_steps` table by slug `"holland"`, like every other step does.

### Bug 3: HollandAssessment doesn't invalidate sidebar cache
**File:** `HollandAssessment.tsx` line ~155-160
**Problem:** After completing the Holland test, the code saves progress but never calls `queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] })`. The sidebar checkmark won't update until the user manually navigates away.
**Fix:** Add `useQueryClient` and invalidate after completion.

### Bug 4: InitialReportStep tries to INSERT into `majors` table (RLS blocked)
**File:** `InitialReportStep.tsx` lines 127-136
**Problem:** When the report generates recommended majors, it tries to INSERT new rows into the `majors` table. But the RLS policy only allows admins to insert. This silently fails for students, meaning `major.id` will be `undefined`, breaking the shortlist step downstream.
**Fix:** Only SELECT existing majors by `name_ar`. If a major doesn't exist in the DB, use a generated UUID locally without inserting.

### Bug 5: ReportStep has NO "Continue" button
**File:** `ReportStep.tsx`
**Problem:** The Holland report page auto-marks the "report" step as completed and displays results, but has absolutely no CTA button to continue to the Certificate step. Students get stuck on this page.
**Fix:** Add a "Continue to Certificate" button at the bottom.

### Bug 6: CompletionNextStep doesn't mark "next-step" as completed
**File:** `CompletionNextStep.tsx`
**Problem:** This is the final step (step 14). It never marks itself as completed in `user_progress`, so the sidebar never shows a checkmark and the journey appears forever incomplete.
**Fix:** Mark the "next-step" step as completed when the page loads.

### Bug 7: ExploreMajorDynamic doesn't persist data to database
**File:** `ExploreMajorDynamic.tsx`
**Problem:** All comfort levels and scenario choices are saved to `localStorage` only. If the student switches devices, all exploration data is lost. The Final Report tries to read explore data from the database and finds nothing.
**Fix:** Save comfort levels and scenario choices to `user_progress.meta_data` for the explore step.

### Bug 8: Dead code files cause confusion
**Files:** `HollandStep.tsx`, `PostImpactStep.tsx`
**Problem:** These files exist but are NOT used in any route. `HollandStep.tsx` navigates to `/dashboard/simulation` (wrong), and `PostImpactStep.tsx` uses the old `QuestionWizard` component. They could confuse future development.
**Fix:** Delete these unused files.

---

## Fix Plan (Ordered by Priority)

### Step 1: Fix SimulationStep navigation (Bug 1)
- Change line 484 from `navigate('/dashboard/report')` to `navigate('/dashboard/post-impact')`
- Update button text from "شوف التقرير النهائي" to "كمّل — قياس الأثر البعدي"

### Step 2: Fix HollandAssessment hardcoded UUID + cache (Bugs 2, 3)
- Remove hardcoded `HOLLAND_STEP_ID` constant
- Fetch UUID dynamically from `journey_steps` where `slug = 'holland'`
- Add `useQueryClient` import and call `invalidateQueries` after completion
- This ensures sidebar updates immediately

### Step 3: Fix InitialReportStep RLS failure (Bug 4)
- Replace `supabase.from('majors').insert(...)` with a SELECT-only approach
- If a major name doesn't exist in DB, assign a local UUID without trying to insert
- This prevents silent failures for all student users

### Step 4: Add Continue button to ReportStep (Bug 5)
- Add a "Continue to Certificate" button at the bottom of the report
- Include a secondary "Download/Share" option
- Use `navigate('/dashboard/certificate')`

### Step 5: Mark CompletionNextStep as completed (Bug 6)
- Add a `useEffect` that marks "next-step" as completed in `user_progress` on mount
- Invalidate sidebar cache so 14/14 shows in the progress bar

### Step 6: Persist ExploreMajorDynamic data to DB (Bug 7)
- In the `handleFinish` function, save comfort levels and scenario choices to `user_progress.meta_data`
- This makes the data available for the Final Report

### Step 7: Remove dead code files (Bug 8)
- Delete `src/pages/dashboard/HollandStep.tsx`
- Delete `src/pages/dashboard/PostImpactStep.tsx`
- Remove their imports from `App.tsx` (they aren't used in routes but may still be imported)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/SimulationStep.tsx` | Fix navigation target (line 484) |
| `src/pages/dashboard/HollandAssessment.tsx` | Dynamic UUID fetch + cache invalidation |
| `src/pages/dashboard/InitialReportStep.tsx` | Remove INSERT into majors, SELECT-only |
| `src/pages/dashboard/ReportStep.tsx` | Add Continue CTA button |
| `src/pages/dashboard/CompletionNextStep.tsx` | Mark next-step as completed |
| `src/pages/dashboard/ExploreMajorDynamic.tsx` | Persist explore data to DB |
| `src/pages/dashboard/HollandStep.tsx` | DELETE (dead code) |
| `src/pages/dashboard/PostImpactStep.tsx` | DELETE (dead code) |
| `src/App.tsx` | Remove dead imports if present |

## No Changes To
- Database schema or RLS policies
- `StepGuard.tsx` (already fixed)
- `AppSidebar.tsx` (working correctly)
- `DashboardLayout.tsx` (working correctly)
- `useJourney` hook (working correctly)
- Admin pages

