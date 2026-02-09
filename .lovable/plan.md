

# Phase 5: Institution Dashboard

## Overview
Build an Institution dashboard that lets school administrators view aggregated analytics across all students in their institution -- without seeing individual student answers (privacy-first). Institutions link to students by shared `school_name` in their profiles.

## What Changes

### 1. Database Migration
- Create `institution_student_links` table:
  - `id` (uuid, PK)
  - `institution_user_id` (uuid, NOT NULL)
  - `student_user_id` (uuid, NOT NULL)
  - `created_at` (timestamptz, default now())
  - Unique constraint on `(institution_user_id, student_user_id)`
- RLS: institution users can read/insert their own links
- Add RLS policy on `user_progress` so institution users can read progress of linked students
- Create RPC `link_students_by_school(school_name text)` (SECURITY DEFINER):
  - Verifies caller is `institution` type
  - Finds all students with matching `school_name` in profiles
  - Bulk-inserts links into `institution_student_links`
  - Returns count of linked students

### 2. New Files

**`src/layouts/InstitutionLayout.tsx`**
- Clean layout similar to ParentLayout
- Header: Athar logo + "لوحة المؤسسة" title + logout button
- No sidebar, wide content area for data tables/charts

**`src/pages/dashboard/InstitutionDashboard.tsx`**
- **Link Students Section**: Input for school name + "ربط الطلاب" button (calls RPC)
- **Summary Cards Row** (4 cards):
  - Total linked students count
  - Students who completed Holland test (%)
  - Students who completed Simulation (%)
  - Students who reached Final Report (%)
- **Journey Completion Chart**: Bar chart (using Recharts, already installed) showing how many students completed each step
- **Holland Distribution Chart**: Pie chart showing distribution of top Holland codes across all linked students (aggregated, no individual data)
- **Student List Table**: Name + overall progress % only (no scores/answers)

### 3. Modified Files

**`src/layouts/DashboardLayout.tsx`**
- Add check: if `user_type === 'institution'`, redirect to `/institution`

**`src/App.tsx`**
- Add `/institution` route with `InstitutionLayout` containing `InstitutionDashboard`

### 4. Privacy Rules
- Institution sees: aggregated counts, percentages, distributions
- Institution does NOT see: individual Holland scores, simulation answers, trait analysis
- Student list shows only name + completion percentage

## Technical Details

### Data Flow
```text
Institution signs up (type=institution) --> /institution dashboard
  --> Enters school name --> RPC links all matching students
  --> Dashboard queries aggregated data from linked students
  --> Charts render using Recharts (already installed)
```

### Aggregation Queries
- Journey completion: COUNT of user_progress entries grouped by step, filtered to linked student IDs
- Holland distribution: GROUP BY top_code from holland_results for linked students
- Progress percentage: COUNT completed steps / total steps per student

### UI Layout
- Summary cards in a 2x2 or 4-column grid
- Charts side by side on desktop, stacked on mobile
- Student table with scroll area for large lists
- All text in Arabic (RTL)

