

# Next Step: Simulation Library + Major Selection

## What We're Building

Right now, the simulation step loads **all 22 scenarios** from every major and presents them one after another. This doesn't make sense -- a student interested in Medicine shouldn't have to answer Graphic Design scenarios.

We'll create a **Major Selection Library** page where students choose which career path to simulate, then experience only that major's scenarios.

## Changes Overview

### 1. New Component: Major Selection Grid (`SimulationLibrary.tsx`)
- A visual grid showing all available majors (Medicine, Engineering, Law, etc.)
- Each card shows the major name in Arabic, an icon, and how many scenarios it has
- Clicking a major stores the selection and transitions to the scenarios

### 2. Update `SimulationStep.tsx`
- Add a state for `selectedMajor` (initially `null`)
- When no major is selected, show the library grid
- When a major is selected, filter scenarios by `major_id` and run only those
- Add a "back to library" button so students can try multiple majors
- After completing one major's scenarios, return to the library (not jump to report)

### 3. Update Navigation Flow
- After finishing all chosen simulations, a "Go to Report" button appears in the library view
- The sidebar step still points to `/dashboard/simulation`

### 4. Major Metadata Map
A local mapping of `major_id` to Arabic name and icon:

```text
MED_001    -> طب بشري      (Stethoscope)
DENT_001   -> طب الأسنان    (SmilePlus)
PHARM_001  -> الصيدلة       (Pill)
ENG_001    -> الهندسة       (Wrench)
CIVIL_001  -> الهندسة المدنية (Building)
IND_001    -> الهندسة الصناعية (Factory)
LAW_001    -> القانون        (Scale)
BUS_001    -> إدارة الأعمال   (Briefcase)
FIN_001    -> المالية        (TrendingUp)
HR_001     -> الموارد البشرية (Users)
TRANS_001  -> الترجمة        (Languages)
MEDIA_001  -> الإعلام        (Radio)
ART_001    -> التصميم        (Palette)
```

## Technical Details

### File Changes

| File | Action |
|------|--------|
| `src/pages/dashboard/SimulationStep.tsx` | Major refactor: add library view + major filtering |

### Key Logic
- Query `simulation_scenarios` grouped by `major_id` using `SELECT DISTINCT major_id` to build the library
- When a major is selected, filter query: `.eq("major_id", selectedMajor)`
- Track completed majors in local state; show checkmarks on completed cards
- Save `simulation_responses` per scenario as before (no change to DB)

### UX Flow

```text
Student arrives at /dashboard/simulation
        |
   [Major Library Grid]
   Select a career to simulate
        |
   Click "طب بشري" (Medicine)
        |
   [Scenario 1 of 3] -> [Scenario 2] -> [Stress scenario with timer]
        |
   "Completed!" -> Back to Library (Medicine card now has checkmark)
        |
   Student can try more majors or click "View Report"
```

