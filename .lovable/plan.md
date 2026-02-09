

# Add Missing Level 2 and Stress Scenarios

## Current Gap

Most majors only have 1 or 2 scenarios. For a consistent experience, each major should have 3 scenarios: Level 1, Level 2, and Stress. Here's what's missing:

| Major | Has L1 | Has L2 | Has Stress | Needs |
|-------|--------|--------|------------|-------|
| MED_001 | Yes | Yes | Yes | Nothing |
| DENT_001 | Yes | No | Yes | L2 |
| PHARM_001 | Yes | No | Yes | L2 |
| ENG_001 | Yes | No | Yes | L2 |
| CIVIL_001 | Yes | No | Yes | L2 |
| IND_001 | Yes | No | No | L2 + Stress |
| LAW_001 | Yes | No | Yes | L2 |
| BUS_001 | Yes | No | Yes | L2 |
| FIN_001 | Yes | No | No | L2 + Stress |
| HR_001 | Yes | No | No | L2 + Stress |
| MEDIA_001 | Yes | No | No | L2 + Stress |
| TRANS_001 | Yes | No | No | L2 + Stress |
| ART_001 | Yes | No | Yes | L2 |

## What We'll Do

Insert ~18 new scenarios into `simulation_scenarios` to bring every major to the full 3-scenario set. Each new scenario will follow the same structure: Arabic text, 3 options with `ai_tag`, and 60-second timers for stress levels.

## Scenario Content (Arabic)

### Level 2 Scenarios (intermediate difficulty)

- **DENT_001**: Patient needs braces but can't afford full treatment -- prioritize or compromise?
- **PHARM_001**: Two drugs prescribed together have a dangerous interaction
- **ENG_001**: Client wants a feature that will create technical debt and security risk
- **CIVIL_001**: Project deadline conflict with safety inspection schedule
- **IND_001**: Quality defect found in a batch already shipped to client
- **LAW_001**: Client asks you to hide evidence that could change the case
- **BUS_001**: Two partners disagree on company direction -- you must mediate
- **FIN_001**: Client wants to invest retirement savings in a high-risk crypto fund
- **HR_001**: Two equally qualified candidates -- one is internal, one external
- **MEDIA_001**: Source leaks explosive story but demands full anonymity
- **TRANS_001**: Legal document has an ambiguous clause that could mean two things
- **ART_001**: Client rejects your design and wants something you consider ugly

### Stress Scenarios (timed, 60 seconds)

- **IND_001**: Machine malfunction during production -- sparks flying near workers
- **FIN_001**: Market crash during live trading session with client watching
- **HR_001**: Employee threatens lawsuit during a termination meeting
- **MEDIA_001**: Live broadcast and the teleprompter fails mid-sentence
- **TRANS_001**: Simultaneous interpretation and the speaker says something culturally offensive

## Technical Details

- Single database migration inserting all ~18 rows into `simulation_scenarios`
- No frontend code changes needed -- the library grid automatically picks up new majors/scenarios
- Each option includes an `ai_tag` for future AI-driven personality analysis

