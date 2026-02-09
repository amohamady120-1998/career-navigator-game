

# Phase 6: Student Profile Completion

## Problem
Currently, the signup form only collects `full_name` and `user_type`. The `school_name` and `grade_level` fields in the `profiles` table are never populated. This means:
- The Institution Dashboard's "link by school name" feature cannot find any students
- The student table shows "---" for grade level
- Parent dashboard doesn't show grade info

## Solution
Add a profile completion step that collects `school_name`, `grade_level`, and `phone` immediately after signup, before the student enters the journey.

## What Changes

### 1. New File: `src/pages/dashboard/ProfileStep.tsx`
A form that appears right after first login for students, collecting:
- **School Name** (text input, required) -- e.g. "مدرسة الملك فهد"
- **Grade Level** (select dropdown, required) -- options like "الصف الأول ثانوي", "الصف الثاني ثانوي", "الصف الثالث ثانوي"
- **Phone** (optional text input)

On submit:
- Updates the `profiles` table with these fields
- Redirects to `/dashboard/intro`

### 2. Modified: `src/layouts/DashboardLayout.tsx`
After auth check and role redirect, add a profile completeness check:
- Query the student's profile for `school_name`
- If `school_name` is null/empty, redirect to `/dashboard/profile` instead of showing the journey

### 3. Modified: `src/App.tsx`
- Add route `/dashboard/profile` pointing to `ProfileStep`

### 4. Modified: `src/pages/Auth.tsx`
- During signup for `institution` type, add a `school_name` input field so institutions know which school they represent
- Store it in the profile on creation

## Technical Details

### Profile Step Flow
```text
Student signs up --> Login --> DashboardLayout checks profile
  --> school_name is null --> redirect to /dashboard/profile
  --> Student fills school_name + grade_level --> profile updated
  --> Redirect to /dashboard/intro (normal journey begins)
```

### Grade Level Options (Saudi system)
- الصف الأول ثانوي
- الصف الثاني ثانوي  
- الصف الثالث ثانوي

### Auth Signup Enhancement
For institution accounts, an additional "اسم المدرسة" field appears during registration so it is stored in their profile immediately.

### No Database Migration Needed
All columns (`school_name`, `grade_level`, `phone`) already exist in the `profiles` table. Only frontend changes are required.

