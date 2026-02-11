
# Fix: Student Journey Flow -- System Freezes, Blank Pages, and Broken Navigation

## Root Cause Analysis

After a thorough code review, I found **7 critical bugs** causing the reported issues (freezes, blank pages, wrong redirects, sidebar inconsistency):

---

### Bug 1: StepGuard route mismatches (causes redirects and blank pages)

The `requiredStep` values in `App.tsx` routes don't match the actual 12-step sequence. Steps are guarded against the wrong predecessor:

| Route | Current `requiredStep` | Correct `requiredStep` |
|-------|----------------------|----------------------|
| `/dashboard/holland` | `pre-impact` | `orientation` |
| `/dashboard/simulation` | `doubt-checkpoint` | `explore` |

This means: after completing `orientation`, the student tries to go to `holland`, but the guard checks for `pre-impact` (already done) -- works by luck. But after completing `explore`, trying to reach `simulation` checks `doubt-checkpoint` instead of `explore`. If `doubt-checkpoint` somehow wasn't marked, it redirects away.

### Bug 2: OrientationStep marks the WRONG step as completed (critical!)

`OrientationStep.tsx` line 107 uses `INTRO_STEP_ID` (the "intro" step UUID) instead of the "orientation" step UUID. So when a student finishes all 3 orientation modules, it marks "intro" as completed (which was already done), and "orientation" is NEVER marked as completed. This means:
- The sidebar never shows orientation as done
- The next step (holland) will never unlock if its guard checks for "orientation"
- The student gets stuck forever

### Bug 3: Missing StepGuards on `orientation` and `explore` routes

In `App.tsx`:
- `/dashboard/orientation` has NO StepGuard -- anyone can access it anytime
- `/dashboard/explore` has NO StepGuard -- anyone can jump to it

### Bug 4: PreImpactStep navigates to wrong next step

After completing pre-impact, `PreImpactStep.tsx` line 65 navigates to `/dashboard/holland`, skipping the orientation step entirely.

### Bug 5: DashboardLayout race condition (causes freezes and white screens)

The `onAuthStateChange` callback in `DashboardLayout.tsx`:
- Has `location.pathname` in its dependency array, re-running async operations on every navigation
- Contains unprotected async operations (no try/catch) that can throw unhandled rejections
- Blocks rendering with `authChecked` state that depends on the auth listener firing
- Multiple rapid navigations can trigger conflicting redirect chains

### Bug 6: ConsentGate blocks children when consent is missing

`ConsentGate.tsx` line 181: `{userConsent ? children : null}` -- if the user dismisses the consent dialog (or it errors), the page renders nothing (blank page). The dialog's `onOpenChange` allows closing it, which leaves a permanent blank page.

### Bug 7: QueryClient has no staleTime/gcTime defaults

`App.tsx` line 62: `const queryClient = new QueryClient()` -- no default options. Every route change triggers fresh refetches of sidebar progress, step-guard data, and profile data, causing flickering and unnecessary loading spinners.

---

## Fix Plan

### 1. Fix OrientationStep -- Use correct step UUID (Bug 2)
- Fetch the "orientation" step UUID dynamically from `journey_steps` table instead of hardcoding the wrong one
- Mark "orientation" as completed (not "intro")

### 2. Fix StepGuard route values in App.tsx (Bug 1 + Bug 3)
- `/dashboard/orientation` -- add `StepGuard requiredStep="pre-impact"`
- `/dashboard/holland` -- change from `requiredStep="pre-impact"` to `requiredStep="orientation"`
- `/dashboard/explore` -- add `StepGuard requiredStep="doubt-checkpoint"`
- `/dashboard/simulation` -- change from `requiredStep="doubt-checkpoint"` to `requiredStep="explore"`

### 3. Fix PreImpactStep navigation (Bug 4)
- Change `navigate("/dashboard/holland")` to `navigate("/dashboard/orientation")`

### 4. Fix DashboardLayout race condition (Bug 5)
- Wrap all async operations in try/catch
- Remove `location.pathname` from the dependency array to prevent re-running on every navigation
- Use a ref for location.pathname so smart-resume only checks on initial load
- Add a flag to prevent duplicate auth processing

### 5. Fix ConsentGate blank page (Bug 6)
- Prevent closing the consent dialog without consenting (remove `onOpenChange` dismiss)
- Show children while dialog is open (so the page isn't blank behind the modal)

### 6. Add QueryClient defaults (Bug 7)
- Set `staleTime: 5 * 60 * 1000` and `gcTime: 10 * 60 * 1000` to prevent unnecessary refetches

### 7. Add global unhandled rejection handler
- Add a `window.addEventListener("unhandledrejection")` in `App.tsx` to prevent white screens from uncaught async errors

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Fix StepGuard values, add QueryClient defaults, add unhandled rejection handler |
| `src/pages/dashboard/OrientationStep.tsx` | Fix step UUID to use "orientation" slug lookup |
| `src/pages/dashboard/PreImpactStep.tsx` | Fix navigation target to `/dashboard/orientation` |
| `src/layouts/DashboardLayout.tsx` | Add try/catch, fix dependency array, prevent re-runs |
| `src/components/ConsentGate.tsx` | Prevent blank page when dialog is open |

## No Changes To
- Holland/scoring logic
- Database schema or RLS policies
- Admin dashboard
- Student profile view
- Any step completion logic (other than OrientationStep UUID fix)
