

# Phase 7: Production Readiness & UX Polish

## Overview
This phase addresses the remaining gaps to make "Athar Start" production-ready: hardening auth flows, adding a landing page with real marketing content, improving the admin search, adding data export for institutions, and fixing role verification in layouts.

## What Changes

### 1. Auth Page Enhancement (`src/pages/Auth.tsx`)
- Add a "Forgot Password?" link below the password field that triggers `supabase.auth.resetPasswordForEmail()`
- Show a confirmation message after signup telling users to check their email
- After login, if `user_type` is already known from profile, redirect to the correct dashboard (`/dashboard`, `/parent`, `/institution`) instead of always going to `/dashboard`

### 2. Landing Page Upgrade (`src/pages/Index.tsx`)
- Add a hero section with a tagline and brief description of what Athar does
- Add a "How It Works" section with 3-4 steps (icons + text)
- Add a FAQ accordion section using the existing Accordion component
- Add a simple footer with copyright and contact info
- Keep the existing role selection cards but move them into a "Get Started" section

### 3. Role Verification in Layouts
- **`src/layouts/InstitutionLayout.tsx`**: After auth check, verify `profile.user_type === 'institution'`. If not, redirect to `/dashboard`
- **`src/layouts/ParentLayout.tsx`**: After auth check, verify `profile.user_type === 'parent'`. If not, redirect to `/dashboard`

### 4. Admin User Search by Email (`src/pages/admin/SuperAdminDashboard.tsx`)
- Create a new edge function `lookup-user-by-email` that uses the Supabase Admin SDK to search `auth.users` by email
- Update the admin dashboard to call this edge function instead of searching profiles by user_id
- Return the user's profile data alongside their auth email

### 5. Institution Data Export
- Add a "Export CSV" button to the Institution Dashboard student table
- Generate a CSV file with columns: Student Name, Grade Level, Progress %
- Trigger browser download using `Blob` + `URL.createObjectURL`

### 6. Settings Page Access for All Roles
- Add a "Settings" link in both `ParentLayout` and `InstitutionLayout` headers
- Route `/parent/settings` and `/institution/settings` pointing to the same `SettingsPage` component
- Or simpler: add a gear icon in the header of both layouts that navigates to a standalone settings route

## Technical Details

### Edge Function: `lookup-user-by-email`
```text
POST /lookup-user-by-email
Body: { email: string }
Auth: Requires admin role check
Response: { user_id, email, full_name, user_type, school_name, grade_level, created_at }
```
Uses `supabase.auth.admin.listUsers()` with email filter, then joins with profiles table.

### CSV Export Logic
Client-side generation using a helper function:
- Map student data to CSV rows
- Create Blob with UTF-8 BOM for Arabic support
- Trigger download with a filename like `students_export_2026-02-09.csv`

### Smart Login Redirect
```text
Login --> Fetch profile.user_type
  --> student --> /dashboard
  --> parent --> /parent  
  --> institution --> /institution
```

### Landing Page Structure
```text
[Hero: Logo + Tagline + CTA]
[How It Works: 4 steps with icons]
[Role Selection Cards: existing]
[FAQ: 4-5 common questions]
[Footer: copyright + contact]
```

### Files Created
- `supabase/functions/lookup-user-by-email/index.ts`

### Files Modified
- `src/pages/Auth.tsx` (forgot password, smart redirect)
- `src/pages/Index.tsx` (full landing page)
- `src/layouts/InstitutionLayout.tsx` (role verification)
- `src/layouts/ParentLayout.tsx` (role verification)
- `src/pages/admin/SuperAdminDashboard.tsx` (email search via edge function)
- `src/pages/dashboard/InstitutionDashboard.tsx` (CSV export button)
- `src/App.tsx` (add settings routes for parent/institution if needed)
