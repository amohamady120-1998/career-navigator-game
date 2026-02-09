

# Fix TAG_MAP in traitMapping.ts

## What Changes
Replace the incomplete `TAG_MAP` (covering ~50 tags) with the complete mapping provided, covering ~100+ tags across all 8 dimensions.

## Technical Details

### File: `src/lib/traitMapping.ts`
- **Replace** the existing `TAG_MAP` constant (lines 18-56) with the complete mapping provided
- New tags added per dimension:
  - **Ethics**: +10 tags (`academic_honesty`, `medical_integrity`, `journalistic_verification`, `moral_absolutism`, `truthfulness`, `brand_protection`, `industry_integrity`, `legal_ethics`, `safety_priority`, `safety_first`)
  - **Leadership**: +7 tags (`emotional_control`, `heroic_action`, `heroic_instinct`, `protective_control`, `team_pressure`, `management_style`, `protective_presence`) -- note: `heroic_action` and `heroic_instinct` moved from `risk_action` to `leadership`
  - **Analytical**: +6 tags (`diagnostic_calm`, `inference_risk`, `logic_check`, `research_deep`, `technical_integrity`, `measured_crisis`, `backup_planning`, `contingency_planning`)
  - **Empathy**: +7 tags (`active_listening`, `human_priority`, `patient_autonomy`, `culture_loyalty`, `diplomatic_save`, `deescalation`, `social_responsibility`)
  - **Risk & Action**: reworked -- removed `heroic_action`/`heroic_instinct`, added `full_stop`, `panic_selling`, `panic_retreat`, `execution_only`, `immediate_action`, `high_stakes_skill`, `risk_management`
  - **Creativity**: +4 tags (`disruptive_modern`, `strategic_maneuver`, `resourceful_helper`, `adaptive_sales`)
  - **Compliance**: +5 tags (`strict_legal_adherence`, `censorship_safety`, `literal_accuracy`, `formal_response`, `protocol_safety`)
  - **Commercial**: +5 tags (`commercial_compliance`, `commercial_submission`, `profit_focus`, `efficiency_focus`, `client_servant`, `service_focus`)

### No other file changes needed
- `analyzeSimulationTraits()` function remains unchanged
- `ReportStep.tsx` remains unchanged
- No database changes

