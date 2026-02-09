

# Phase 4: Parent Dashboard

## Overview
Create a Parent dashboard that lets parents view their child's journey progress without seeing specific answers or scores (privacy-first). Parents link to their child via email lookup.

## What Changes

### 1. Database Migration
- Create a `parent_child_links` table:
  - `id` (uuid, PK)
  - `parent_user_id` (uuid, NOT NULL) -- references the parent's auth user
  - `child_user_id` (uuid, NOT NULL) -- references the student's auth user
  - `created_at` (timestamptz)
  - Unique constraint on `(parent_user_id, child_user_id)`
- RLS policies: parents can only read/insert their own links

### 2. New Files
- **`src/pages/dashboard/ParentDashboard.tsx`** -- The main parent view with:
  - A "link child" form (enter child's email to look up their user ID)
  - A progress overview showing which journey steps the child has completed (checkmarks) vs. pending (locked icons)
  - No scores, no answers, no detailed data -- privacy first
- **`src/layouts/ParentLayout.tsx`** -- Simpler layout for parents (header + content, no student sidebar/steps)

### 3. Modified Files
- **`src/layouts/DashboardLayout.tsx`** -- After auth check, query the user's `profiles.user_type`. If `parent`, redirect to `/parent` dashboard instead of showing student sidebar.
- **`src/App.tsx`** -- Add routes:
  - `/parent` with `ParentLayout` containing `ParentDashboard`
- **`src/pages/Auth.tsx`** -- No changes needed (already stores `user_type` in profile on signup)

### 4. Edge Function: `lookup-child`
- Accepts a child email, looks up their `auth.users` id, verifies they are a `student` in profiles, and returns the `child_user_id`
- This avoids exposing the `auth.users` table to the client

## Technical Details

### Parent Dashboard UI
- Card with input field for child email + "ربط" (Link) button
- Once linked, shows a list of journey steps with completion status icons
- Queries `parent_child_links` to get child ID, then `user_progress` joined with `journey_steps` for that child
- Shows child's name from `profiles.full_name`

### Privacy Rules
- Parent sees: step name + completed/pending status only
- Parent does NOT see: Holland scores, simulation answers, rationale text, trait analysis

### Flow
```text
Parent signs up (type=parent) --> /parent dashboard
  --> Enters child email --> Edge function looks up child
  --> Link saved to parent_child_links
  --> Dashboard shows child's step completion progress
```
