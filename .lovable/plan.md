

# Phase 9 Refinements: Remaining Polish Items

Most of Phase 9 was already implemented in previous iterations. Here are the small remaining improvements to fully satisfy the requirements.

## Already Done (No Changes Needed)
- ThemeToggle component with Sun/Moon icons and aria-label
- ThemeProvider wrapping the app with `attribute="class"`
- ThemeToggle in DashboardLayout, ParentLayout, InstitutionLayout, and Index.tsx headers
- ErrorBoundary wrapping all routes in App.tsx
- Print styles hiding sidebar, header, and data-sidebar elements
- RIASEC and simulation progress bars have `role="progressbar"` and `aria-valuenow`
- Institution Dashboard charts already use `h-72` height and `grid-cols-1 md:grid-cols-2`
- Student table already wrapped in `overflow-x-auto`
- Dark/light CSS variables fully defined

## Remaining Changes

### 1. Enhanced Print Styles (`src/index.css`)
Add missing print rules:
- Hide `nav`, `.no-print`, `.theme-toggle` elements
- Add `@page { margin: 0.5in; }` for cleaner page margins
- Force text to dark colors for readability on paper

### 2. Simulation Grid Mobile Fix (`src/pages/dashboard/SimulationStep.tsx`)
Change library grid from `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` so cards display properly on small phones.

### 3. Aria Labels on Icon-Only Buttons
Add `aria-label` to the Settings and Logout buttons in:
- `src/layouts/ParentLayout.tsx`
- `src/layouts/InstitutionLayout.tsx`
- `src/layouts/DashboardLayout.tsx` (SidebarTrigger already has it)

### 4. Bar Chart Dark Mode Color
In `InstitutionDashboard.tsx`, change the hardcoded bar fill `#051730` to `hsl(var(--primary))` so it adapts to dark mode via CSS variables. Since Recharts doesn't support CSS variables directly, use `"currentColor"` and set the container's text color, or use `var(--foreground)` via a computed style.

---

## Technical Details

### Print Styles Addition (index.css)
Extend the existing `@media print` block:
- Add `nav, .no-print, .theme-toggle { display: none !important; }`
- Add `@page { margin: 0.5in; }` at the top level
- Add `a { color: black !important; text-decoration: none !important; }`

### SimulationStep Grid (line 270)
Change: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### Aria Labels
Add `aria-label="الإعدادات"` to Settings buttons and `aria-label="تسجيل الخروج"` to Logout buttons in ParentLayout and InstitutionLayout.

### Files Modified
- `src/index.css` -- enhanced print styles
- `src/pages/dashboard/SimulationStep.tsx` -- mobile grid fix
- `src/layouts/ParentLayout.tsx` -- aria labels on buttons
- `src/layouts/InstitutionLayout.tsx` -- aria labels on buttons
- `src/pages/dashboard/InstitutionDashboard.tsx` -- dark-mode-friendly chart color

