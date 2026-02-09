

# Add 5 Missing Majors to Simulation Library

## Overview
Add 15 new simulation scenarios (3 per major) for the 5 remaining career paths that are defined in the UI but have no database content yet.

## Missing Majors
1. **ARCH_001** - الهندسة المعمارية (Architecture)
2. **CYBER_001** - الأمن السيبراني (Cybersecurity)
3. **AI_001** - الذكاء الاصطناعي (Artificial Intelligence)
4. **PSY_001** - علم النفس (Psychology)
5. **MKT_001** - التسويق الرقمي (Digital Marketing)

## Scenarios to Insert (15 total)

### ARCH_001 (Architecture)
| Level | Scenario | Options |
|-------|----------|---------|
| 1 | Client wants a building design that violates local zoning regulations but offers a higher budget | A: Refuse (regulatory_compliance), B: Accept with modifications (creative_adaptation), C: Suggest alternative site (problem_solving) |
| 2 | Structural engineer says your award-winning design is unsafe in earthquakes and needs major changes | A: Redesign completely (safety_priority), B: Add structural reinforcement keeping the design (compromise_engineering), C: Get a second opinion from another engineer (verification_seeking) |
| stress (60s) | During construction, a wall collapses and workers are trapped. Emergency services are 30 minutes away! | A: Rush in to help rescue (heroic_instinct), B: Secure the area and prevent further collapse (engineering_response), C: Call emergency and organize first aid (coordination_leadership) |

### CYBER_001 (Cybersecurity)
| Level | Scenario | Options |
|-------|----------|---------|
| 1 | You discover a vulnerability in your company's system. Reporting it will delay a major product launch | A: Report immediately (security_first), B: Patch it quietly and launch on time (silent_fix), C: Report but propose a temporary workaround (balanced_approach) |
| 2 | A colleague is using company credentials to access restricted data. They claim it's for a legitimate project | A: Report to management immediately (whistleblower), B: Confront them privately first (diplomatic_investigation), C: Monitor their activity silently before acting (surveillance_approach) |
| stress (60s) | Active ransomware attack! Systems are encrypting in real-time and attackers demand payment in 2 hours! | A: Disconnect all systems from the network immediately (containment_first), B: Start negotiating with attackers to buy time (tactical_negotiation), C: Restore from backup while isolating infected systems (recovery_protocol) |

### AI_001 (Artificial Intelligence)
| Level | Scenario | Options |
|-------|----------|---------|
| 1 | Your AI model shows 95% accuracy but has bias against a minority group in hiring recommendations | A: Deploy it anyway, 95% is excellent (performance_over_fairness), B: Stop deployment until bias is fixed (ethical_ai), C: Deploy with a human review layer for flagged cases (hybrid_oversight) |
| 2 | Your client wants you to build an AI surveillance system that could be used to monitor employees without consent | A: Build it, the client decides how to use it (tool_neutrality), B: Refuse the project entirely (moral_stance), C: Build it with mandatory transparency features (ethical_engineering) |
| stress (60s) | Your autonomous vehicle AI just caused an accident in testing -- a pedestrian is injured and media is arriving! | A: Shut down all testing immediately (full_stop), B: Secure the scene and call medical help first (human_priority), C: Preserve all AI logs as evidence before anything (data_preservation) |

### PSY_001 (Psychology)
| Level | Scenario | Options |
|-------|----------|---------|
| 1 | A teenage patient tells you they are being bullied but begs you not to tell their parents | A: Respect confidentiality completely (patient_trust), B: Inform the parents immediately (parental_duty), C: Work with the patient to find a way to involve parents together (collaborative_approach) |
| 2 | During therapy, a patient reveals plans that could harm another person but hasn't acted yet | A: Break confidentiality and report immediately (duty_to_warn), B: Try to talk them out of it in session first (therapeutic_intervention), C: Consult with a colleague before deciding (professional_consultation) |
| stress (60s) | A patient in your office is having a severe panic attack -- hyperventilating, crying, and threatening to hurt themselves! | A: Call emergency services immediately (medical_escalation), B: Use grounding techniques calmly (clinical_composure), C: Clear the room and stay with them one-on-one (protective_presence) |

### MKT_001 (Digital Marketing)
| Level | Scenario | Options |
|-------|----------|---------|
| 1 | Your client wants you to run ads with exaggerated claims about their product's effectiveness | A: Run the ads as requested (client_service), B: Refuse and explain the legal risks (ethical_marketing), C: Rewrite the ads with accurate but compelling language (creative_honesty) |
| 2 | A competitor's internal strategy document was leaked online. Using it would give your client a huge advantage | A: Use it immediately, it's public now (opportunistic), B: Ignore it completely, it's unethical (moral_high_ground), C: Report the leak to the competitor (industry_integrity) |
| stress (60s) | Your client's social media post just went viral for the wrong reasons -- thousands of angry comments and trending hashtags! | A: Delete the post immediately (damage_control), B: Post a public apology right away (rapid_response), C: Take 10 minutes to craft a proper response with the team (measured_crisis) |

## Technical Steps

1. **Insert 15 scenarios** into `simulation_scenarios` table via a single SQL INSERT with correct columns: `major_id`, `level`, `text_ar`, `timer_seconds`, `options_json`
2. **Verify** all 18 majors now have exactly 3 levels each (total: 54 scenarios)

No code changes needed -- the UI (`SimulationStep.tsx`) already reads dynamically from the database and `MAJOR_META` already has entries for all 5 majors.

