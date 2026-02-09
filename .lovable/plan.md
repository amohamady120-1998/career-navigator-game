
# Phase 9: Mobile Responsiveness, Dark Mode & Accessibility

## Overview
The app is feature-complete and secure. This phase focuses on polish that makes it feel professional on all devices and accessible to all users.

## What Changes

### 1. Mobile-Responsive Sidebar
The current sidebar uses Radix SidebarProvider which handles collapsing, but several pages have layout issues on small screens:
- The Simulation library grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) is fine, but the scenario view and report page need padding/spacing adjustments for mobile
- The Institution Dashboard charts overflow on small screens -- wrap them in a single-column layout on mobile
- The Super Admin Dashboard needs `overflow-x-auto` on its tables (already has it) and responsive KPI cards

### 2. Dark Mode Toggle
The project already imports `next-themes` and has a `.dark` CSS class defined in `index.css`. Add:
- A theme toggle button (Sun/Moon icon) in the dashboard header and landing page
- Wire up `ThemeProvider` from `next-themes` in `App.tsx`
- Verify all custom colors (`--success`, `--link`, `--accent`) work in dark mode (they are already defined in `.dark`)

### 3. Accessibility Improvements
- Add `aria-label` attributes to icon-only buttons (sidebar trigger, theme toggle, logout)
- Add `role="progressbar"` and `aria-valuenow` to custom progress bars in the report and simulation views
- Ensure all form inputs have associated labels (already done in most cases)
- Add keyboard navigation support to the simulation option cards (they're already buttons, so this mostly works)

### 4. Loading States & Error Boundaries
- Add a React Error Boundary component wrapping the main routes to catch render crashes gracefully
- Show a user-friendly error page with a "Try Again" button instead of a white screen
- Add skeleton loaders to the Institution Dashboard charts while data loads

### 5. Print Stylesheet for Certificate
- Add `@media print` styles to hide the sidebar, header, and non-certificate content
- Ensure the certificate renders cleanly on A4 paper
- The print button already exists; just ensure the output is clean

## Technical Details

### ThemeProvider Setup
Wrap the app in `ThemeProvider` from `next-themes` with `attribute="class"` and `defaultTheme="light"`. Add a `ThemeToggle` component that uses `useTheme()` hook.

### Error Boundary
Create `src/components/ErrorBoundary.tsx` using React's class component `componentDidCatch`. Display a centered error card with the Athar logo and a reload button.

### Print Styles
Add to `src/index.css`:
- `@media print { .sidebar, header, .print\\:hidden { display: none !important; } }`
- Certificate container gets `border: 2px solid #051730` in print

### Files Created
- `src/components/ThemeToggle.tsx`
- `src/components/ErrorBoundary.tsx`

### Files Modified
- `src/App.tsx` (wrap with ThemeProvider + ErrorBoundary)
- `src/layouts/DashboardLayout.tsx` (add ThemeToggle to header)
- `src/pages/Index.tsx` (add ThemeToggle to hero area)
- `src/index.css` (print styles)
- `src/pages/dashboard/ReportStep.tsx` (aria attributes on bars)
- `src/pages/dashboard/SimulationStep.tsx` (minor mobile spacing)
