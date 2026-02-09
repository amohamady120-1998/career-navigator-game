// src/lib/traitMapping.ts

export type TraitDimension = 
  | 'ethics' 
  | 'leadership' 
  | 'analytical' 
  | 'empathy' 
  | 'risk_action' 
  | 'creativity' 
  | 'compliance' 
  | 'commercial';

export const TRAIT_LABELS: Record<TraitDimension, string> = {
  ethics: 'النزاهة والأخلاقيات المهنية',
  leadership: 'القيادة وإدارة الأزمات',
  analytical: 'التفكير التحليلي والمنطقي',
  empathy: 'الذكاء العاطفي والتواصل',
  risk_action: 'المبادرة وسرعة الحسم',
  creativity: 'الإبداع وحل المشكلات',
  compliance: 'الالتزام بالأنظمة والمعايير',
  commercial: 'الوعي التجاري والعملي'
};

// Map the raw AI tags from our scenarios to these dimensions
export const TAG_MAP: Record<string, TraitDimension> = {
  // --- Ethics & Integrity (النزاهة) ---
  'ethical_strictness': 'ethics', 'patient_safety_first': 'ethics', 'security_first': 'ethics',
  'whistleblower': 'ethics', 'ethical_ai': 'ethics', 'honesty': 'ethics', 'integrity': 'ethics',
  'moral_stance': 'ethics', 'fiduciary_duty': 'ethics', 'academic_honesty': 'ethics',
  'medical_integrity': 'ethics', 'journalistic_verification': 'ethics', 'moral_absolutism': 'ethics',
  'truthfulness': 'ethics', 'brand_protection': 'ethics', 'industry_integrity': 'ethics',
  'legal_ethics': 'ethics', 'safety_priority': 'ethics', 'safety_first': 'ethics',

  // --- Leadership & Pressure (القيادة) ---
  'coordination_leadership': 'leadership', 'leadership_under_fire': 'leadership',
  'decisive_leadership': 'leadership', 'calm_authority': 'leadership',
  'clinical_composure': 'leadership', 'crisis_management': 'leadership',
  'emotional_control': 'leadership', 'heroic_action': 'leadership', 'heroic_instinct': 'leadership',
  'protective_control': 'leadership', 'team_pressure': 'leadership', 'management_style': 'leadership',
  'protective_presence': 'leadership',

  // --- Analytical (التحليل) ---
  'data_driven_decision': 'analytical', 'root_cause_analysis': 'analytical',
  'verification_seeking': 'analytical', 'investigative_check': 'analytical',
  'strategic_planning': 'analytical', 'accuracy_first': 'analytical',
  'diagnostic_calm': 'analytical', 'inference_risk': 'analytical', 'logic_check': 'analytical',
  'research_deep': 'analytical', 'technical_integrity': 'analytical', 'measured_crisis': 'analytical',
  'backup_planning': 'analytical', 'contingency_planning': 'analytical',

  // --- Empathy (التعاطف) ---
  'patient_trust': 'empathy', 'emotional_empathy': 'empathy',
  'collaborative_approach': 'empathy', 'mediation_skills': 'empathy',
  'sympathy_over_science': 'empathy', 'team_harmony': 'empathy',
  'active_listening': 'empathy', 'human_priority': 'empathy', 'patient_autonomy': 'empathy',
  'culture_loyalty': 'empathy', 'diplomatic_save': 'empathy', 'deescalation': 'empathy',
  'social_responsibility': 'empathy',

  // --- Risk & Action (المبادرة) ---
  'risk_action': 'risk_action', 'rapid_response': 'risk_action',
  'opportunistic': 'risk_action', 'scoop_hunter': 'risk_action',
  'full_stop': 'risk_action', 'panic_selling': 'risk_action', 'panic_retreat': 'risk_action',
  'execution_only': 'risk_action', 'immediate_action': 'risk_action',
  'high_stakes_skill': 'risk_action', 'risk_management': 'risk_action',

  // --- Creativity (الإبداع) ---
  'creative_adaptation': 'creativity', 'problem_solving': 'creativity',
  'innovative_design': 'creativity', 'creative_honesty': 'creativity',
  'improvisation_skill': 'creativity', 'solution_architecture': 'creativity',
  'disruptive_modern': 'creativity', 'strategic_maneuver': 'creativity',
  'resourceful_helper': 'creativity', 'adaptive_sales': 'creativity',

  // --- Compliance (الامتثال) ---
  'regulatory_compliance': 'compliance', 'procedure_compliance': 'compliance',
  'safety_protocol': 'compliance', 'security_protocol': 'compliance',
  'rule_adherence': 'compliance', 'strict_legal_adherence': 'compliance',
  'censorship_safety': 'compliance', 'literal_accuracy': 'compliance',
  'formal_response': 'compliance', 'protocol_safety': 'compliance',

  // --- Commercial (التجاري) ---
  'commercial_focus': 'commercial', 'cost_focus': 'commercial',
  'client_service': 'commercial', 'money_focus': 'commercial',
  'commercial_compliance': 'commercial', 'commercial_submission': 'commercial',
  'profit_focus': 'commercial', 'efficiency_focus': 'commercial',
  'client_servant': 'commercial', 'service_focus': 'commercial'
};

export function analyzeSimulationTraits(responses: any[], scenarios: any[]) {
  const scores: Record<TraitDimension, number> = {
    ethics: 0, leadership: 0, analytical: 0, empathy: 0,
    risk_action: 0, creativity: 0, compliance: 0, commercial: 0
  };

  responses.forEach(res => {
    const scenario = scenarios.find(s => s.id === res.scenario_id);
    if (!scenario || !scenario.options_json) return;
    
    // Parse options if string, or use directly if array
    const options = typeof scenario.options_json === 'string' 
      ? JSON.parse(scenario.options_json) 
      : scenario.options_json;
      
    const selectedOption = options.find((o: any) => o.id === res.selected_option_id);
    
    if (selectedOption && selectedOption.ai_tag) {
      const dimension = TAG_MAP[selectedOption.ai_tag];
      if (dimension) {
        scores[dimension]++;
      }
    }
  });

  // Convert to array and sort by score desc
  return Object.entries(scores)
    .map(([key, score]) => ({ 
      key: key as TraitDimension, 
      label: TRAIT_LABELS[key as TraitDimension], 
      score 
    }))
    .sort((a, b) => b.score - a.score);
}
