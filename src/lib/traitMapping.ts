/**
 * Maps simulation ai_tags to 8 behavioral personality dimensions.
 * Used by ReportStep to analyze a student's simulation choices.
 */

export interface Dimension {
  key: string;
  labelAr: string;
  description: string;
  color: string;
}

export const DIMENSIONS: Dimension[] = [
  { key: "ethics", labelAr: "الأخلاق والنزاهة", description: "تتمسك بالمبادئ الأخلاقية وتضع النزاهة فوق المكاسب الشخصية. تتخذ قراراتك بناءً على ما هو صحيح وليس ما هو سهل.", color: "hsl(var(--accent))" },
  { key: "leadership", labelAr: "القيادة تحت الضغط", description: "تبرز قدراتك القيادية في أصعب اللحظات. تتحمل المسؤولية وتوجه الفريق بثقة عندما تشتد الأزمات.", color: "hsl(142, 71%, 45%)" },
  { key: "analytical", labelAr: "التفكير التحليلي", description: "تعتمد على البيانات والتحليل المنهجي في قراراتك. تبحث عن الأسباب الجذرية وتتحقق من المعلومات قبل التصرف.", color: "hsl(221, 83%, 53%)" },
  { key: "empathy", labelAr: "التعاطف والتواصل", description: "تمتلك حساسية عالية تجاه مشاعر الآخرين وتسعى لحل النزاعات بالحوار. تؤمن بقوة التعاون والعمل الجماعي.", color: "hsl(280, 67%, 55%)" },
  { key: "risk", labelAr: "المخاطرة والحسم", description: "لا تتردد في اتخاذ قرارات جريئة عندما يتطلب الموقف ذلك. تتحرك بسرعة وحسم حتى في ظل عدم اليقين.", color: "hsl(0, 84%, 60%)" },
  { key: "creativity", labelAr: "الإبداع وحل المشكلات", description: "تبحث عن حلول مبتكرة وغير تقليدية للتحديات. تحول القيود إلى فرص وتجد مخارج ذكية من المواقف الصعبة.", color: "hsl(38, 92%, 50%)" },
  { key: "compliance", labelAr: "الامتثال والحذر", description: "تلتزم بالإجراءات والبروتوكولات المعتمدة وتحرص على الدقة. تفضل الأمان والتخطيط المسبق على المجازفة.", color: "hsl(190, 70%, 45%)" },
  { key: "commercial", labelAr: "التركيز التجاري", description: "تهتم بالجوانب المالية والتجارية وتسعى لتحقيق أفضل عائد. تفهم ديناميكيات السوق وتتخذ قرارات موجهة بالنتائج.", color: "hsl(330, 65%, 50%)" },
];

/** Maps every known ai_tag to its dimension key */
const TAG_TO_DIMENSION: Record<string, string> = {
  // Ethics
  ethical_ai: "ethics", moral_stance: "ethics", patient_safety_first: "ethics", quality_integrity: "ethics",
  regulatory_compliance: "ethics", ethical_refusal: "ethics", ethical_strictness: "ethics", medical_integrity: "ethics",
  fiduciary_duty: "ethics", honest_professionalism: "ethics", ethical_marketing: "ethics", ethical_engineering: "ethics",
  moral_absolutism: "ethics", moral_high_ground: "ethics", industry_integrity: "ethics", creative_honesty: "ethics",
  academic_honesty: "ethics", duty_to_warn: "ethics", whistleblower: "ethics", patient_safety: "ethics",
  security_first: "ethics", risk_transparency: "ethics", strategic_honesty: "ethics",

  // Leadership Under Pressure
  coordination_leadership: "leadership", leadership_under_fire: "leadership", calm_authority: "leadership",
  clinical_composure: "leadership", crisis_management: "leadership", emergency_protocol: "leadership",
  critical_prioritization: "leadership", formal_response: "leadership", corrective_action: "leadership",
  rapid_response: "leadership", engineering_response: "leadership", medical_escalation: "leadership",
  failover_execution: "leadership", conviction_under_pressure: "leadership",

  // Analytical Thinking
  data_driven_decision: "analytical", analytical_patience: "analytical", root_cause_analysis: "analytical",
  verification_seeking: "analytical", investigative_check: "analytical", journalistic_verification: "analytical",
  research_deep: "analytical", data_driven_pitch: "analytical", diagnostic_calm: "analytical",
  quality_assurance: "analytical", process_optimization: "analytical", literal_accuracy: "analytical",
  professional_consultation: "analytical", measured_crisis: "analytical",

  // Empathy & Communication
  emotional_empathy: "empathy", collaborative_approach: "empathy", deescalation: "empathy",
  mediation_skills: "empathy", patient_autonomy: "empathy", patient_trust: "empathy",
  team_harmony: "empathy", communication_first: "empathy", creative_deescalation: "empathy",
  persuasive_educator: "empathy", therapeutic_intervention: "empathy", protective_presence: "empathy",
  collaborative_judgment: "empathy", professional_collaboration: "empathy", parental_duty: "empathy",
  diplomatic_investigation: "empathy", diplomatic_save: "empathy", sympathy_over_science: "empathy",
  resourceful_helper: "empathy",

  // Risk-Taking & Decisiveness
  heroic_action: "risk", risk_action: "risk", full_stop: "risk", heroic_risk: "risk",
  heroic_instinct: "risk", high_stakes_skill: "risk", pragmatic_risk: "risk",
  inference_risk: "risk", risk_escalation: "risk", contrarian_investing: "risk",
  human_priority: "risk", clinical_intervention: "risk",

  // Creativity & Problem-Solving
  creative_adaptation: "creativity", problem_solving: "creativity", innovative_design: "creativity",
  improvisation_skill: "creativity", efficient_creativity: "creativity", cultural_adaptation: "creativity",
  development_hybrid: "creativity", balanced_approach: "creativity", hybrid_oversight: "creativity",
  compromise_engineering: "creativity", contingency_planning: "creativity", backup_planning: "creativity",
  technical_rescue: "creativity", negotiation_skill: "creativity", timeout_strategy: "creativity",
  silent_fix: "creativity", recovery_protocol: "creativity", disruptive_modern: "creativity",

  // Compliance & Caution
  procedure_compliance: "compliance", safety_protocol: "compliance", protocol_safety: "compliance",
  accuracy_first: "compliance", safety_priority: "compliance", cautious_reporting: "compliance",
  liability_protection: "compliance", security_protocol: "compliance", risk_management: "compliance",
  risk_balance: "compliance", safety_retreat: "compliance", containment_first: "compliance",
  freeze_response: "compliance", censorship_safety: "compliance", surveillance_approach: "compliance",
  data_preservation: "compliance",

  // Commercial Focus
  client_service: "commercial", money_focus: "commercial", cost_focus: "commercial",
  opportunistic: "commercial", cost_cutting: "commercial", marketing_party: "commercial",
  brand_protection: "commercial", growth_invest: "commercial", staff_bonus: "commercial",
  desperate_retention: "commercial", client_compliance: "commercial", client_servant: "commercial",
  commercial_hiding: "commercial", commercial_submission: "commercial", service_focus: "commercial",
  proactive_service: "commercial", damage_control: "commercial",

  // Remaining tags mapped to closest dimension
  bluff_confidence: "risk", composure_request: "leadership", culture_loyalty: "empathy",
  emotional_control: "leadership", execution_only: "compliance", loyal_defender: "empathy",
  machine_focus: "analytical", neutral_conduit: "compliance", panic_retreat: "compliance",
  panic_selling: "commercial", passive_compliance: "compliance", performance_over_fairness: "commercial",
  power_alignment: "commercial", pressure_compliance: "compliance", pressure_response: "leadership",
  quantity_over_quality: "commercial", resource_addition: "creativity", responsibility_transfer: "compliance",
  scoop_hunter: "risk", silence_strategy: "compliance", tactical_negotiation: "creativity",
  task_oriented: "analytical", technical_integrity: "analytical", tool_neutrality: "analytical",
};

export interface DimensionScore {
  dimension: Dimension;
  count: number;
  percentage: number;
}

/**
 * Given a list of ai_tags the student selected, compute scores per dimension.
 * Returns sorted by count descending.
 */
export function computeDimensionScores(tags: string[]): DimensionScore[] {
  const counts: Record<string, number> = {};
  DIMENSIONS.forEach((d) => (counts[d.key] = 0));

  tags.forEach((tag) => {
    const dimKey = TAG_TO_DIMENSION[tag];
    if (dimKey && counts[dimKey] !== undefined) {
      counts[dimKey]++;
    }
  });

  const maxCount = Math.max(...Object.values(counts), 1);

  return DIMENSIONS.map((d) => ({
    dimension: d,
    count: counts[d.key],
    percentage: (counts[d.key] / maxCount) * 100,
  })).sort((a, b) => b.count - a.count);
}

/** Major ID to Arabic label */
export const MAJOR_LABELS: Record<string, string> = {
  MED_001: "الطب البشري",
  ENG_001: "الهندسة",
  LAW_001: "القانون",
  FIN_001: "التمويل والاستثمار",
  CS_001: "علوم الحاسب",
  MEDIA_001: "الإعلام",
  PHARM_001: "الصيدلة",
  DESIGN_001: "التصميم",
  EDU_001: "التعليم",
  BA_001: "إدارة الأعمال",
  SOCIAL_001: "العمل الاجتماعي",
  NURSE_001: "التمريض",
  AVIATION_001: "الطيران",
  ARCH_001: "العمارة",
  CYBER_001: "الأمن السيبراني",
  AI_001: "الذكاء الاصطناعي",
  PSY_001: "علم النفس",
  MKT_001: "التسويق الرقمي",
};
