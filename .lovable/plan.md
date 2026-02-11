
# Full System Completion Plan -- Athar Platform

## Current State Summary

The platform has most individual pages built, but they are **not properly connected** into a cohesive end-to-end journey. Here is the audit of what exists vs. what needs fixing:

### What Works
- Landing page (role selection) -> Auth -> Profile -> Payment
- Orientation (3 video modules + quizzes)
- Pre-Impact assessment (8 questions)
- Holland Assessment (42 questions, auto-save, DB scoring)
- Simulation (7 scenarios, 4 stages, cognitive metrics)
- Post-Impact assessment (8 questions)
- Final Report (Holland + Simulation analysis)
- Certificate
- AI Counselor (streaming chat)
- Admin portal (promo codes, system settings, explore manager)
- Parent & Institution dashboards (basic)

### Critical Issues to Fix

---

## Phase 1: Fix the Journey Flow (Broken Navigation Chain)

The sidebar and StepGuard only know about 6 journey_steps slugs: `intro, pre-impact, holland, simulation, post-impact, report`. But the actual desired flow includes Initial Report, Shortlist, Excluded Majors, Doubt Checkpoint, and Explore -- none of which are in `journey_steps` or the sidebar.

### 1.1 Add Missing Journey Steps to Database
Insert new rows into `journey_steps` to register the missing steps so StepGuard and the sidebar can track them:

```text
order_index 7: initial-report (التقرير المبدئي)
order_index 8: shortlist (ترتيب الاختيارات)
order_index 9: excluded-majors (تخصصات أقل توافقاً)
order_index 10: doubt-checkpoint (لحظة صدق)
```

### 1.2 Fix Step ID References
Currently, `ExcludedMajorsStep`, `DoubtCheckpointStep`, `ShortlistStep`, and `InitialReportStep` use **string literals** like `'excluded_majors'` and `'initial_report'` as `step_id` when upserting to `user_progress`. But `user_progress.step_id` is a UUID column that references `journey_steps.id`. This means **all saves are silently failing** (or being rejected by type mismatch). Each step page must look up the actual UUID from `journey_steps` by slug before saving.

### 1.3 Fix Navigation Chain
Current broken links:
- `HollandAssessment` completion -> navigates to `/dashboard/simulation` (should go to `/dashboard/initial-report`)
- `InitialReportStep` continue -> navigates to `/dashboard/shortlist` (correct)
- `ShortlistStep` continue -> navigates to `/dashboard/why-not` (route doesn't exist; should be `/dashboard/excluded-majors`)
- `ExcludedMajorsStep` continue -> navigates to `/dashboard/shortlist` (wrong; should go to `/dashboard/doubt-checkpoint`)

Correct flow after Holland:
```text
Holland -> Initial Report -> Shortlist -> Excluded Majors -> Doubt Checkpoint -> (Explore / Simulation / AI Counselor based on choice)
```

### 1.4 Update Sidebar
Add the new steps (initial-report, shortlist, excluded-majors, doubt-checkpoint) to the sidebar's `STEP_ORDER` array and icon map so they show up and lock/unlock properly.

### 1.5 Update StepGuard
Extend `STEP_ORDER` in `StepGuard.tsx` and `DashboardLayout.tsx` to include the new slugs in the correct sequence.

---

## Phase 2: Fix Data Flow (Relational Majors)

### 2.1 InitialReportStep -- Use Holland Results Properly
The page currently has a `FALLBACK_REPORT` but doesn't actually use the real Holland results from `holland_codes` table (which has 94 entries with `recommended_majors`, `strengths`, `weaknesses`). Update to:
1. Fetch the user's `top_code` from `holland_results`
2. Look up matching `holland_codes` entries for each letter
3. Map recommended majors to the `majors` table (auto-create if missing)
4. Store the complete report in `user_progress.meta_data`

### 2.2 Populate `holland_major_map`
The table exists but is **empty**. Seed it with mappings from Holland code combinations to major IDs so the InitialReportStep can use relational lookups instead of only `holland_codes.recommended_majors`.

### 2.3 ShortlistStep -- Use `student_shortlist` Table
The `student_shortlist` table was created but ShortlistStep still reads/writes from `user_progress.meta_data`. Update to use the dedicated table for persistence (parents and institutions have RLS policies to read it).

---

## Phase 3: Fix Explore Major System

### 3.1 Consolidate Duplicate Explore Pages
There are TWO explore pages:
- `ExploreMajorDynamic.tsx` -- hardcoded content for 2 majors, uses `?major=` query param
- `ExploreMajorDatabase.tsx` -- database-driven, uses `/:majorId` route param

**Action**: Remove the hardcoded `ExploreMajorDynamic.tsx` and keep only `ExploreMajorDatabase.tsx`. Update the `/dashboard/explore` route to show a major selection list, and `/dashboard/explore/:majorId` for the actual journey.

### 3.2 Seed Explore Content
The `major_explore_sections` table is **empty**. Seed at least 2-3 majors with full 5-stage content so the system is testable.

---

## Phase 4: Fix Persistent Bugs

### 4.1 `user_progress` Upsert Conflicts
Multiple pages use `upsert` with different conflict strategies. The table needs a unique constraint on `(user_id, step_id)` for upserts to work. Verify this exists and add if missing.

### 4.2 Remove localStorage Dependencies
Several pages (ExcludedMajors, DoubtCheckpoint, ExploreMajorDynamic) rely on localStorage instead of the database. Since `user_progress.meta_data` (JSONB) exists, migrate all state to the database for cross-device persistence.

### 4.3 Fix `step_id` Type Mismatch
`user_progress.step_id` is a UUID. Pages that pass string literals like `'initial_report'` will fail. All pages must look up the UUID from `journey_steps` first.

---

## Phase 5: Complete Missing Features

### 5.1 Create Explore Major List Page
When a user navigates to `/dashboard/explore` without a majorId, show a list of their shortlisted majors with progress indicators and "Start/Continue" buttons.

### 5.2 Wire Up Doubt Checkpoint Routes
The doubt checkpoint dynamically routes based on confidence level:
- Level 1 (confident) -> `/dashboard/explore` (explore list)
- Level 2 (two choices) -> `/dashboard/simulation`
- Level 3 (unconvinced) -> `/dashboard/explore`
- Level 4 (lost) -> `/dashboard/ai-counselor`

---

## Phase 6: Admin & Data Seeding

### 6.1 Seed Holland Major Mappings
Insert rows into `holland_major_map` linking common 2-3 letter codes to majors.

### 6.2 Seed Sample Majors + Explore Content
Insert 3-5 majors and their 5-stage explore sections via the admin manager or direct SQL.

---

## Implementation Order

1. **Database fixes** (journey_steps inserts, unique constraint, holland_major_map seed, explore content seed)
2. **Fix step_id references** across all affected pages (InitialReport, Shortlist, ExcludedMajors, DoubtCheckpoint)
3. **Fix navigation chain** (Holland -> InitialReport -> Shortlist -> ExcludedMajors -> DoubtCheckpoint)
4. **Update Sidebar + StepGuard** with new step slugs
5. **Fix InitialReportStep** to use real Holland data from `holland_codes`
6. **Fix ShortlistStep** to use `student_shortlist` table
7. **Consolidate Explore pages** and create major list page
8. **Remove localStorage dependencies** in favor of `user_progress.meta_data`
9. **Test end-to-end flow**

---

## Technical Details

### Files to Modify
- `src/components/AppSidebar.tsx` -- Add new step icons and slugs
- `src/components/StepGuard.tsx` -- Extend STEP_ORDER
- `src/layouts/DashboardLayout.tsx` -- Extend STEP_ORDER
- `src/pages/dashboard/InitialReportStep.tsx` -- Fix step_id, use real Holland data
- `src/pages/dashboard/ShortlistStep.tsx` -- Fix step_id, use student_shortlist, fix navigation
- `src/pages/dashboard/ExcludedMajorsStep.tsx` -- Fix step_id, fix navigation target
- `src/pages/dashboard/DoubtCheckpointStep.tsx` -- Fix step_id, remove localStorage
- `src/pages/dashboard/HollandAssessment.tsx` -- Change completion navigation to `/dashboard/initial-report`
- `src/pages/dashboard/ExploreMajorDynamic.tsx` -- Replace with major list page
- `src/App.tsx` -- Clean up duplicate routes, add StepGuards for new steps

### Database Changes (SQL)
- INSERT 4 new rows into `journey_steps`
- ADD unique constraint on `user_progress(user_id, step_id)` if missing
- INSERT sample data into `holland_major_map`
- INSERT sample majors into `majors`
- INSERT sample explore content into `major_explore_sections`

### Estimated Scope
- ~10 files modified
- ~2-3 database migrations
- ~1 new component (Explore Major List)
