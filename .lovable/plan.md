

# Fix: Journey Steps Order + Missing Steps

## Problem
The `journey_steps` table in the database has incorrect `order_index` values and is missing two steps (`orientation` and `explore`). This causes:
- The sidebar step unlocking logic to break (steps unlock based on the previous step being completed, using the sidebar order, but DB order is different)
- The initial report showing majors in a different order than the shortlist/tests page expects
- Steps appearing locked or unlocked at the wrong time

### Current DB State (wrong)
| order | slug | name |
|-------|------|------|
| 1 | intro | المقدمة |
| 2 | pre-impact | قياس الأثر القبلي |
| 3 | holland | اختبار هولاند |
| 4 | simulation | المحاكاة المهنية |
| 5 | post-impact | قياس الأثر البعدي |
| 6 | report | التقرير النهائي |
| 7 | initial-report | التقرير المبدئي |
| 8 | shortlist | ترتيب الاختيارات |
| 9 | excluded-majors | تخصصات أقل توافقاً |
| 10 | doubt-checkpoint | لحظة صدق |
| -- | orientation | MISSING |
| -- | explore | MISSING |

### Correct Order (to match sidebar and business logic)
| order | slug | name |
|-------|------|------|
| 1 | intro | المقدمة |
| 2 | pre-impact | قياس الأثر القبلي |
| 3 | orientation | التهيئة |
| 4 | holland | اختبار هولاند |
| 5 | initial-report | التقرير المبدئي |
| 6 | shortlist | ترتيب الاختيارات |
| 7 | excluded-majors | تخصصات أقل توافقاً |
| 8 | doubt-checkpoint | لحظة صدق |
| 9 | explore | استكشاف التخصص |
| 10 | simulation | المحاكاة المهنية |
| 11 | post-impact | قياس الأثر البعدي |
| 12 | report | التقرير النهائي |

## Plan

### 1. Database Migration
- Insert the two missing steps: `orientation` (order 3) and `explore` (order 9)
- Update `order_index` for all existing steps to match the correct journey sequence
- This is a data-only change; no schema modifications needed

### 2. Update StepGuard.tsx
- Add `orientation` and `explore` to the `STEP_ORDER` array so the guard correctly enforces the full 12-step sequence

### 3. Update HollandAssessment.tsx
- The file hardcodes `HOLLAND_STEP_ID = "0b586437-03db-40c4-8cdc-4f889a322c49"` which is correct and won't change (we're only updating `order_index`, not IDs)
- No changes needed here

### 4. No changes to Holland/scoring logic
- Only step ordering and missing step insertion are affected

## Technical Details

### SQL Migration
```sql
-- Insert missing steps
INSERT INTO journey_steps (slug, name_ar, order_index, is_locked)
VALUES 
  ('orientation', 'التهيئة', 3, true),
  ('explore', 'استكشاف التخصص', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- Fix order_index for all steps
UPDATE journey_steps SET order_index = 1 WHERE slug = 'intro';
UPDATE journey_steps SET order_index = 2 WHERE slug = 'pre-impact';
UPDATE journey_steps SET order_index = 3 WHERE slug = 'orientation';
UPDATE journey_steps SET order_index = 4 WHERE slug = 'holland';
UPDATE journey_steps SET order_index = 5 WHERE slug = 'initial-report';
UPDATE journey_steps SET order_index = 6 WHERE slug = 'shortlist';
UPDATE journey_steps SET order_index = 7 WHERE slug = 'excluded-majors';
UPDATE journey_steps SET order_index = 8 WHERE slug = 'doubt-checkpoint';
UPDATE journey_steps SET order_index = 9 WHERE slug = 'explore';
UPDATE journey_steps SET order_index = 10 WHERE slug = 'simulation';
UPDATE journey_steps SET order_index = 11 WHERE slug = 'post-impact';
UPDATE journey_steps SET order_index = 12 WHERE slug = 'report';
```

### StepGuard.tsx change
Update the `STEP_ORDER` constant from:
```
["intro", "pre-impact", "holland", ...]
```
to:
```
["intro", "pre-impact", "orientation", "holland", "initial-report", "shortlist", "excluded-majors", "doubt-checkpoint", "explore", "simulation", "post-impact", "report"]
```

### Files to modify
- **New migration SQL** (database)
- **src/components/StepGuard.tsx** (add missing slugs to STEP_ORDER)

### No files affected
- AppSidebar.tsx already has the correct order
- Holland scoring logic remains untouched

