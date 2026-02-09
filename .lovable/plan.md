

# Phase 8: Session Persistence, Journey Guards & UX Hardening

## What's Missing

After a thorough audit, the application is feature-complete but has several reliability and UX gaps that would cause issues in production:

### 1. No Journey Step Guards
Students can manually navigate to any step URL (e.g., `/dashboard/report`) even if they haven't completed prior steps. The sidebar locks steps visually, but there's no actual route-level protection.

### 2. No Auth State Listener
The app checks auth once on mount via `getSession()`, but doesn't listen for auth state changes (e.g., token refresh, logout from another tab). This can lead to stale sessions and silent failures.

### 3. ReportStep Doesn't Mark Itself Complete
The ReportStep renders results but never marks the "report" step as `completed` in `user_progress`. This means the Certificate page is permanently locked since it checks for report completion.

### 4. No "Logout from all layouts" Consistency
ParentLayout has logout, InstitutionLayout has logout, but DashboardLayout relies on the sidebar. All good, but after logout the user lands on "/" -- the auth check should also clear `localStorage` pledge state.

### 5. No Resumed Progress
When a student returns to the dashboard after partially completing the journey, they always land on `/dashboard` (IntroStep). They should be redirected to their **last incomplete step** to resume.

---

## Implementation Plan

### 1. Journey Step Guard Component
Create `src/components/StepGuard.tsx` -- a wrapper that checks if the previous step is completed before rendering children. If not, redirects to the correct step.

- Wraps each step page inside the route
- Queries `user_progress` + `journey_steps` to verify the prerequisite step is done
- Shows a loading spinner while checking
- Redirects to the last completed step + 1 if the prerequisite isn't met

### 2. Auth State Listener in DashboardLayout
Replace the one-time `getSession()` check with `supabase.auth.onAuthStateChange()` in all three layouts. This handles:
- Automatic logout detection
- Token refresh
- Session expiry redirect to `/auth`

### 3. Mark Report as Complete
Update `ReportStep.tsx` to mark the "report" step as `completed` in `user_progress` when the report data loads successfully. This unlocks the Certificate page.

### 4. Smart Resume on Dashboard Entry
Update `DashboardLayout.tsx`: after verifying the student profile is complete, check their progress and redirect to the **first incomplete step** instead of always landing on IntroStep.

### 5. Clean Logout
Update the logout handler in `AppSidebar.tsx` to clear `athar_pledge_accepted` from localStorage, so the pledge modal shows again on next login.

---

## Technical Details

### StepGuard Component
```text
<StepGuard requiredStep="holland">
  <SimulationStep />
</StepGuard>

Logic:
1. Fetch user_progress for current user
2. Check if requiredStep slug is in completed list
3. If yes -> render children
4. If no -> redirect to /dashboard/{requiredStep}
```

### Route Updates in App.tsx
Each step route wraps its element with StepGuard:
- `/dashboard/pre-impact` requires "intro" completed
- `/dashboard/holland` requires "pre-impact" completed
- `/dashboard/simulation` requires "holland" completed
- `/dashboard/post-impact` requires "simulation" completed
- `/dashboard/report` requires "post-impact" completed
- `/dashboard/certificate` requires "report" completed

### ReportStep Completion Logic
```text
On mount, after successfully loading holland_results:
1. Fetch journey_steps where slug = 'report'
2. Upsert user_progress with status = 'completed'
3. Invalidate 'user-progress-slugs' query
```

### Smart Resume Logic in DashboardLayout
```text
After auth + profile check:
1. Fetch all user_progress for this user
2. Map completed step slugs
3. Find first step in STEP_ORDER not completed
4. If on /dashboard (index), redirect to /dashboard/{first_incomplete_step}
```

### Files Created
- `src/components/StepGuard.tsx`

### Files Modified
- `src/App.tsx` (wrap step routes with StepGuard)
- `src/pages/dashboard/ReportStep.tsx` (mark report complete)
- `src/layouts/DashboardLayout.tsx` (auth listener + smart resume)
- `src/components/AppSidebar.tsx` (clean logout)
