

# Enhance Report with Simulation Analysis

## Overview
Upgrade the Report page to include a comprehensive simulation personality analysis alongside the existing Holland results. The report will analyze the student's `ai_tag` choices across all completed simulations to generate descriptive behavioral insights.

## What Changes

### 1. Create an AI Tag Trait Mapping
Group the 150+ `ai_tag` values into ~8 descriptive personality dimensions:

| Dimension (Arabic) | Example ai_tags |
|---|---|
| الأخلاق والنزاهة (Ethics) | `ethical_ai`, `moral_stance`, `patient_safety_first`, `quality_integrity`, `regulatory_compliance` |
| القيادة تحت الضغط (Leadership Under Pressure) | `coordination_leadership`, `leadership_under_fire`, `calm_authority`, `clinical_composure` |
| التفكير التحليلي (Analytical Thinking) | `data_driven_decision`, `analytical_patience`, `root_cause_analysis`, `verification_seeking` |
| التعاطف والتواصل (Empathy & Communication) | `emotional_empathy`, `collaborative_approach`, `deescalation`, `mediation_skills` |
| المخاطرة والحسم (Risk-Taking & Decisiveness) | `heroic_action`, `risk_action`, `decisive_leadership`, `full_stop` |
| الإبداع وحل المشكلات (Creativity & Problem-Solving) | `creative_adaptation`, `problem_solving`, `innovative_design`, `improvisation_skill` |
| الامتثال والحذر (Compliance & Caution) | `procedure_compliance`, `safety_protocol`, `protocol_safety`, `accuracy_first` |
| التركيز التجاري (Commercial Focus) | `client_service`, `money_focus`, `cost_focus`, `opportunistic` |

### 2. Build Simulation Analysis Section in ReportStep
- Query `simulation_responses` joined with `simulation_scenarios` to get the student's selected `ai_tag` for each scenario
- Tally tags per dimension to compute a radar/bar profile
- Display results as descriptive text (no numeric scores shown to students per business rules)

### 3. UI Additions to ReportStep.tsx
- New "تحليل المحاكاة" (Simulation Analysis) section below Holland results
- Horizontal bar chart showing relative strength per dimension
- Top 3 dominant traits highlighted with descriptive paragraphs
- Completed majors summary showing which career paths were explored

### 4. New File: `src/lib/traitMapping.ts`
- Contains the `ai_tag` to dimension mapping
- Helper function to compute dimension scores from a list of selected tags
- Descriptive text generator for top traits

## Technical Steps

1. **Create** `src/lib/traitMapping.ts` -- trait mapping constants and scoring helper
2. **Update** `src/pages/dashboard/ReportStep.tsx` -- add simulation data query and new UI sections

## No Database Changes Needed
All data is already stored. We just need to read `simulation_responses` + `simulation_scenarios` and analyze client-side.

