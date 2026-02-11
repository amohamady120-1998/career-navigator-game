
# Expand Admin Dashboard — Unified Control Panel

## Problem
The admin dashboard (`/admin`) currently shows only 3 tabs (Overview, Promo Codes, System Settings), while 8 other admin features are scattered across separate routes (`/admin/schools`, `/admin/analytics`, etc.). The admin has no way to discover or navigate to them from the main dashboard.

## Solution
Consolidate all admin pages into the SuperAdminDashboard as tabs, making it a single unified control panel.

## New Tab Structure (10 tabs total)

| Tab | Label | Source |
|-----|-------|--------|
| overview | نظرة عامة | AdminOverviewTab (existing) |
| schools | المدارس | AdminSchools |
| school-orders | طلبات المدارس | AdminSchoolOrders |
| school-admins | مشرفو المدارس | AdminSchoolAdmins |
| school-usage | استخدام المدارس | AdminSchoolUsage |
| school-reports | تقارير المدارس | AdminSchoolReports |
| consultations | الاستشارات | AdminConsultations |
| explore | مدير الاستكشاف | AdminExploreManager |
| promo | أكواد الخصم | PromoCodesTab (existing) |
| notifications | الإشعارات | AdminNotifications |
| analytics | التحليلات | AdminAnalytics |
| errors | سجل الأخطاء | AdminErrors |
| health | فحص النظام | AdminHealthCheck |
| settings | إعدادات النظام | SystemSettingsTab (existing) |

## Technical Details

### 1. Update `SuperAdminDashboard.tsx`
- Import all admin page components
- Replace the 3-tab layout with a scrollable TabsList containing all 14 sections
- Each tab renders its corresponding component inline
- Use a 2-row or scrollable tab bar since 14 tabs won't fit in one row
- Group related tabs visually (Schools group, Content group, Monitoring group, Settings group)

### 2. Adapt admin page components
- Each standalone admin page (e.g., `AdminSchools.tsx`, `AdminAnalytics.tsx`) currently wraps itself in its own container with `max-w-5xl mx-auto p-6 dir="rtl"` and its own title `h1`. These need to be stripped so they render cleanly inside tabs.
- Create lightweight wrapper versions or modify each component to remove the outer layout wrapper, since the parent dashboard already provides it.

### 3. Keep separate routes working
- Keep the individual `/admin/*` routes in `App.tsx` so direct links still work
- No routes removed, only the dashboard gets enhanced

### Files to modify
- `src/pages/admin/SuperAdminDashboard.tsx` — Add all tabs with imports
- `src/pages/admin/AdminSchools.tsx` — Remove outer wrapper (or render conditionally)
- `src/pages/admin/AdminSchoolOrders.tsx` — Same
- `src/pages/admin/AdminSchoolAdmins.tsx` — Same
- `src/pages/admin/AdminSchoolUsage.tsx` — Same
- `src/pages/admin/AdminSchoolReports.tsx` — Same
- `src/pages/admin/AdminConsultations.tsx` — Same
- `src/pages/admin/AdminExploreManager.tsx` — Same
- `src/pages/admin/AdminNotifications.tsx` — Same
- `src/pages/admin/AdminAnalytics.tsx` — Same
- `src/pages/admin/AdminErrors.tsx` — Same
- `src/pages/admin/AdminHealthCheck.tsx` — Same

### No changes to
- Holland/scoring logic
- Database schema
- RLS policies
- Any student-facing pages
