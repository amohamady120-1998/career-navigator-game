

# Phase 10: Final Polish & Quality of Life

The application is feature-complete. This phase focuses on small but impactful improvements to user experience and code quality.

## 1. Add ThemeToggle to Parent and Institution Layouts

Currently only the Dashboard and Landing page have the dark mode toggle. The Parent and Institution layouts are missing it, creating an inconsistent experience.

- Add `ThemeToggle` to the header of `ParentLayout.tsx`
- Add `ThemeToggle` to the header of `InstitutionLayout.tsx`

## 2. Redirect Authenticated Users Away from Auth/Landing

If a logged-in user visits `/` or `/auth`, they currently see the landing/login page instead of being redirected to their dashboard. Add session checks:

- In `Index.tsx`: Check for active session on mount. If found, redirect to dashboard based on role.
- In `Auth.tsx`: Check for active session on mount. If found, redirect by role.

## 3. Add Loading State to Auth Page

The Auth page submits but shows no visual loading indicator beyond the button text changing. Add a `Loader2` spinner icon to the submit button while `loading` is true.

## 4. Invalidate Progress Queries After Step Completion

Several step pages (IntroStep, PreImpactStep, PostImpactStep) mark their step as complete but don't invalidate the `user-progress-slugs` and `step-guard-progress` queries. This means the sidebar and StepGuard may show stale data until a page refresh.

- Add `useQueryClient()` and call `invalidateQueries` after upsert in IntroStep, PreImpactStep, and PostImpactStep.

## 5. ProfileStep Should Use Dashboard Layout Styles

The ProfileStep renders its own full-screen layout with `min-h-screen bg-primary`, which looks out of place when rendered inside the DashboardLayout (it already has a sidebar and header). Adjust it to render as a standard content card within the existing layout.

---

## Technical Details

### Files Modified
- `src/layouts/ParentLayout.tsx` -- import and add ThemeToggle to header
- `src/layouts/InstitutionLayout.tsx` -- import and add ThemeToggle to header
- `src/pages/Index.tsx` -- add useEffect to check session and redirect
- `src/pages/Auth.tsx` -- add useEffect to check session and redirect; add Loader2 to button
- `src/pages/dashboard/IntroStep.tsx` -- add query invalidation after completing step
- `src/pages/dashboard/PreImpactStep.tsx` -- add query invalidation after completing step
- `src/pages/dashboard/PostImpactStep.tsx` -- add query invalidation after completing step
- `src/pages/dashboard/ProfileStep.tsx` -- remove full-screen wrapper, use card-style layout within DashboardLayout

