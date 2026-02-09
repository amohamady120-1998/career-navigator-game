

# Comprehensive Audit and Completion Plan for Athar Start

## Current Status Summary

### What's Working
- Landing page with role selection (Student/Parent/Institution)
- Authentication (signup/login with email)
- Pledge modal ("عهد أثر")
- Dashboard layout with sidebar navigation
- Pre-Impact assessment (8 Likert-scale questions)
- Holland test (42 RIASEC questions in batches of 6)
- Holland scoring via database functions
- Simulation library (54 scenarios across 18 majors, 3 levels each)
- Report page with Holland results + simulation trait analysis
- Database tables: profiles, questions, answers, holland_results, holland_codes, simulation_scenarios, simulation_responses, journey_steps, user_progress, user_roles

### What's Missing/Broken

---

## Issue 1: TAG_MAP is Missing ~110 AI Tags (Critical)

The database contains **~160 unique `ai_tag` values** but `traitMapping.ts` only maps **~50**. This means roughly **2 out of 3 student choices are silently ignored** in the report analysis.

**Missing tags include (partial list):**
`academic_honesty`, `analytical_patience`, `backup_planning`, `bluff_confidence`, `brand_protection`, `cautious_reporting`, `censorship_safety`, `client_compliance`, `client_servant`, `clinical_intervention`, `collaborative_judgment`, `commercial_hiding`, `commercial_submission`, `communication_first`, `composure_request`, `contingency_planning`, `contrarian_investing`, `conviction_under_pressure`, `corrective_action`, `cost_cutting`, `creative_deescalation`, `crisis_management` (already mapped), `critical_prioritization`, `cultural_adaptation`, `culture_loyalty`, `damage_control`, `data_driven_pitch`, `desperate_retention`, `development_hybrid`, `diagnostic_calm`, `diplomatic_save`, `disruptive_modern`, `distraction_tactic`, `efficient_creativity`, `emergency_protocol`, `emotional_control`, `ethical_refusal`, `failover_execution`, `formal_response`, `freeze_response`, `growth_invest`, `heroic_risk`, `high_stakes_skill`, `honest_professionalism`, `inference_risk`, `journalistic_verification`, `liability_protection`, `literal_accuracy`, `loyal_defender`, `machine_focus`, `marketing_party`, `medical_integrity`, `meritocracy`, `moral_absolutism`, `negotiation_skill`, `neutral_conduit`, `panic_retreat`, `panic_selling`, `passive_compliance`, `patient_autonomy`, `patient_safety`, `performance_over_fairness`, `persuasive_educator`, `power_alignment`, `pragmatic_isolation`, `pragmatic_risk`, `pressure_compliance`, `pressure_response`, `proactive_service`, `process_optimization`, `professional_collaboration`, `protocol_safety`, `quality_assurance`, `quality_integrity`, `quantity_over_quality`, `research_deep`, `resource_addition`, `resourceful_helper`, `responsibility_transfer`, `risk_balance`, `risk_escalation`, `risk_management`, `risk_transparency`, `root_cause_analysis` (mapped), `safety_retreat`, `service_focus`, `silence_strategy`, `staff_bonus`, `strategic_honesty`, `sympathy_over_science` (mapped), `task_oriented`, `technical_integrity`, `technical_rescue`, `timeout_strategy`, `tool_neutrality`

**Fix:** Update `traitMapping.ts` to map ALL ~160 tags to the 8 dimensions.

---

## Issue 2: Step Locking is Disabled

The sidebar comment says: *"For now, all steps unlocked for development"*. The `UNLOCKED_SLUGS` array hardcodes all steps as open. The `user_progress` table exists but has **0 rows** -- it's never written to.

**Fix:**
- Write to `user_progress` when each step is completed (IntroStep, PreImpactStep, HollandStep, SimulationStep)
- Update `AppSidebar.tsx` to query `user_progress` and dynamically lock/unlock steps
- IntroStep needs a "Start" button that marks it as complete

---

## Issue 3: IntroStep Has No "Start" Button

The intro page is purely informational with no way to mark it as "done" or proceed. Students see text but have no call to action.

**Fix:** Add a "ابدأ الرحلة" (Start Journey) button that writes to `user_progress` and navigates to `/dashboard/pre-impact`.

---

## Issue 4: No Post-Impact Assessment

The business logic requires a Pre-Impact and **Post-Impact** assessment to measure student growth. There is no PostImpactStep page, no `post_impact` questions in the database, and no route for it.

**Fix:**
- Insert 8 post-impact questions into the `questions` table (category: `post_impact`)
- Create `src/pages/dashboard/PostImpactStep.tsx`
- Add a route in `App.tsx`
- Add a journey step in the database
- Place it between Simulation and Report in the journey

---

## Issue 5: No Logout Functionality

There is no logout button anywhere in the app. Users cannot sign out.

**Fix:** Add a logout button to the sidebar footer.

---

## Issue 6: Parent and Institution Dashboards Don't Exist

The landing page offers 3 roles but all routes lead to the same student dashboard. Parents and institutions have no dedicated views.

**Fix:** Create role-specific dashboard views:
- **Parent:** Read-only view of their child's progress (privacy-first, no detailed scores)
- **Institution:** Aggregated stats across students

---

## Issue 7: MAJOR_LABELS Mismatch in ReportStep

The `MAJOR_LABELS` in `ReportStep.tsx` contains keys like `CS_001`, `DESIGN_001`, `EDU_001`, `BA_001`, `SOCIAL_001`, `NURSE_001`, `AVIATION_001` that don't exist in the database. Meanwhile the actual DB major IDs like `DENT_001`, `IND_001`, `CIVIL_001`, `HR_001`, `TRANS_001`, `ART_001`, `BUS_001` are missing from this map.

**Fix:** Align `MAJOR_LABELS` with the actual 18 `MAJOR_META` keys from `SimulationStep.tsx`.

---

## Issue 8: Simulation Rationale Requirement Inconsistency

The business rules state rationale is required for **every** answer (min 20 chars), but the code only shows the rationale textarea for stress-level scenarios.

**Fix:** Show the rationale textarea for all levels and enforce a minimum of 20 characters.

---

## Issue 9: No Debounced Autosave in Simulations

Business rules require debounced autosave with "Saved" toast, but the simulation only saves on explicit "Submit" click.

**Fix:** Add a debounced autosave (e.g. 2-second delay) that saves the current selection as draft, with a subtle "Saved" indicator.

---

## Issue 10: No `beforeunload` Safety Net

Business rules require a `beforeunload` event to prevent accidental navigation during simulations.

**Fix:** Add `beforeunload` listener in `SimulationStep.tsx` when a scenario is in progress.

---

## Prioritized Implementation Plan

### Phase 1 -- Critical Data Fixes (must do first)
1. **Complete TAG_MAP** -- Map all ~160 ai_tags to the 8 dimensions in `traitMapping.ts`
2. **Fix MAJOR_LABELS** -- Align ReportStep labels with actual DB major IDs

### Phase 2 -- Core Journey Completion
3. **Add IntroStep "Start" button** -- CTA + write to `user_progress`
4. **Implement step locking** -- Query `user_progress` in sidebar, write completion on each step finish
5. **Add Post-Impact assessment** -- DB questions + new page + route + journey step
6. **Add logout button** -- Sidebar footer

### Phase 3 -- Business Logic Enforcement
7. **Rationale for all levels** -- Show textarea on every scenario, enforce 20-char min
8. **Debounced autosave** -- Auto-save draft selections with toast
9. **beforeunload guard** -- Prevent accidental navigation during simulation

### Phase 4 -- Role-Based Dashboards
10. **Parent dashboard** -- Progress-only view with child linking
11. **Institution dashboard** -- Aggregated analytics view

---

## Technical Details

### Files to Create
- `src/pages/dashboard/PostImpactStep.tsx` -- mirrors PreImpactStep with `post_impact` category

### Files to Modify
- `src/lib/traitMapping.ts` -- add ~110 missing tag mappings
- `src/pages/dashboard/ReportStep.tsx` -- fix MAJOR_LABELS, add post-impact comparison
- `src/pages/dashboard/IntroStep.tsx` -- add Start button + progress write
- `src/pages/dashboard/PreImpactStep.tsx` -- write to `user_progress` on completion
- `src/pages/dashboard/HollandStep.tsx` -- write to `user_progress` on completion
- `src/pages/dashboard/SimulationStep.tsx` -- rationale for all levels, autosave, beforeunload
- `src/components/AppSidebar.tsx` -- dynamic step locking from `user_progress`
- `src/layouts/DashboardLayout.tsx` -- route user type to correct dashboard
- `src/App.tsx` -- add PostImpactStep route, parent/institution routes

### Database Changes
- Insert 8 `post_impact` questions into `questions` table
- Insert 1 new journey step for post-impact (order_index: 4.5, between simulation and report)
- Re-order journey steps if needed

### No Breaking Changes
All changes are additive. Existing student data remains valid.

