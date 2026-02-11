

# Student Profile View -- Accessible by Student, Parent, and Institution

## Current State
- **Student**: No unified profile view. Data is scattered across individual step pages (Holland, Shortlist, Final Report, etc.)
- **Parent**: Can see basic milestone progress + Holland results in a simple dialog
- **Institution**: Can see student list with progress percentage + Holland code in a dialog
- Both Parent and Institution views are missing: shortlist choices, explore comfort levels, simulation traits, impact scores, and certificate status

## Solution
Create a reusable `StudentProfile` component that displays all student-specific data in one comprehensive view. This component will be used in three places:
1. Student's own dashboard (new route `/dashboard/my-profile`)
2. Parent dashboard (replaces the basic dialog)
3. Institution dashboard (replaces the basic dialog)

## What the Student Profile Will Show

| Section | Data Source | Description |
|---------|------------|-------------|
| Basic Info | `profiles` | Name, grade, school |
| Journey Progress | `user_progress` + `journey_steps` | Visual progress bar + step completion status |
| Holland Results | `holland_results` + `holland_codes` | RIASEC scores bar chart, top code, description, strengths/weaknesses |
| Top Majors | `student_shortlist` + `majors` | Ranked shortlist of chosen majors |
| Explore Insights | `major_explore_responses` | Comfort level per year (year1-post_grad) |
| Simulation Traits | `simulation_responses` + `simulation_scenarios` | Top 3 decision-making traits |
| Impact Comparison | `impact_assessments` | Pre vs Post score comparison |
| Certificate | `certificates` | Certificate status and code |

## Technical Details

### 1. New Component: `src/components/StudentProfileView.tsx`
- Accepts a `studentId: string` prop and an optional `studentName: string`
- Fetches all data using the provided `studentId`
- Works for all three roles because RLS already allows:
  - Students to read their own data
  - Parents to read linked child data (via `parent_child_links`)
  - Institutions to read linked student data (via `institution_student_links`)
- Renders a clean, card-based layout with all sections above
- Reuses the same RIASEC labels, trait mapping, and comfort labels from existing code

### 2. Student Access: New sidebar link + route
- Add "ملفي" (My Profile) link in `AppSidebar.tsx` footer
- Add route `/dashboard/my-profile` in `App.tsx`
- Create thin page `src/pages/dashboard/MyProfile.tsx` that passes `session.user.id` to `StudentProfileView`

### 3. Parent Dashboard Update
- Replace the simple Holland dialog with a full-page `StudentProfileView` when clicking "View Report"
- Use a larger Dialog or navigate to an inline expanded view
- Keep the link-child card and children list as-is

### 4. Institution Dashboard Update
- Replace the simple student detail dialog with `StudentProfileView`
- Keep the student table, charts, and CSV export as-is

### RLS -- No Changes Needed
All required RLS policies already exist:
- `holland_results`: Parents can read via `parent_child_links` (missing -- needs SELECT policy)
- `student_shortlist`: Parents and Institutions already have SELECT policies
- `user_progress`: Parents and Institutions already have SELECT policies
- `profiles`: Parents and Institutions already have SELECT policies
- `impact_assessments`: Only user + admin can read (needs parent/institution SELECT policies)
- `major_explore_responses`: Only user can read (needs parent/institution SELECT policies)
- `simulation_responses`: Only user can read (needs parent/institution SELECT policies)
- `certificates`: Only user + admin can read (needs parent/institution SELECT policies)

### Database Migration: Add Missing RLS Policies
Add SELECT policies for parent and institution access to:
- `impact_assessments` -- parent + institution SELECT via link tables
- `major_explore_responses` -- parent + institution SELECT via link tables
- `simulation_responses` -- parent + institution SELECT via link tables
- `certificates` -- parent + institution SELECT via link tables
- `holland_results` -- parent SELECT via `parent_child_links` (institution already exists)

### Files to Create
- `src/components/StudentProfileView.tsx` -- Reusable student profile component
- `src/pages/dashboard/MyProfile.tsx` -- Student's own profile page

### Files to Modify
- `src/components/AppSidebar.tsx` -- Add "ملفي" link in footer
- `src/App.tsx` -- Add `/dashboard/my-profile` route
- `src/pages/dashboard/ParentDashboard.tsx` -- Use `StudentProfileView` in dialog
- `src/pages/dashboard/InstitutionDashboard.tsx` -- Use `StudentProfileView` in dialog

### No Changes To
- Holland/scoring logic
- Journey step order
- Any assessment or simulation logic
- Admin dashboard
