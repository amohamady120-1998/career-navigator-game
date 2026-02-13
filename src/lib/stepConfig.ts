/**
 * Centralized Step Configuration — Single Source of Truth
 * All journey navigation MUST reference this config.
 */

export type StepConfig = {
  slug: string;
  route: string;
  labelAr: string;
  order: number;
};

/**
 * STRICT journey order. No page may skip or reorder these.
 */
export const JOURNEY_STEPS: StepConfig[] = [
  { slug: "intro",            route: "/dashboard/intro",            labelAr: "البداية",                    order: 1  },
  { slug: "pre-impact",       route: "/dashboard/pre-impact",       labelAr: "مقياس الأثر القبلي",         order: 2  },
  { slug: "orientation",      route: "/dashboard/orientation",      labelAr: "مرحلة التهيئة",              order: 3  },
  { slug: "holland",          route: "/dashboard/holland",          labelAr: "اختبار الميول المهنية",      order: 4  },
  { slug: "initial-report",   route: "/dashboard/initial-report",   labelAr: "تقريرك المبدئي",             order: 5  },
  { slug: "shortlist",        route: "/dashboard/shortlist",        labelAr: "ترتيب الاختيارات",           order: 6  },
  { slug: "excluded-majors",  route: "/dashboard/excluded-majors",  labelAr: "تخصصات أقل توافقًا",        order: 7  },
  { slug: "doubt-checkpoint", route: "/dashboard/doubt-checkpoint", labelAr: "لحظة صدق",                  order: 8  },
  { slug: "explore",          route: "/dashboard/explore",          labelAr: "استكشاف التخصص",             order: 9  },
  { slug: "simulation",       route: "/dashboard/simulation",       labelAr: "المحاكاة المهنية",           order: 10 },
  { slug: "post-impact",      route: "/dashboard/post-impact",      labelAr: "مقياس الأثر البعدي",        order: 11 },
  { slug: "report",           route: "/dashboard/final-report",     labelAr: "التقرير النهائي",            order: 12 },
  { slug: "certificate",      route: "/dashboard/certificate",      labelAr: "شهادة إتمام البرنامج",      order: 13 },
  { slug: "next-step",        route: "/dashboard/next-step",        labelAr: "الخطوة التالية",             order: 14 },
];

/** Ordered slug list for guards */
export const STEP_SLUGS = JOURNEY_STEPS.map(s => s.slug);

/** Get next route after a given slug */
export function getNextRoute(currentSlug: string): string {
  const idx = JOURNEY_STEPS.findIndex(s => s.slug === currentSlug);
  if (idx === -1 || idx === JOURNEY_STEPS.length - 1) return "/dashboard";
  return JOURNEY_STEPS[idx + 1].route;
}

/** Get previous route before a given slug */
export function getPreviousRoute(currentSlug: string): string {
  const idx = JOURNEY_STEPS.findIndex(s => s.slug === currentSlug);
  if (idx <= 0) return "/dashboard";
  return JOURNEY_STEPS[idx - 1].route;
}

/** Get step config by slug */
export function getStepBySlug(slug: string): StepConfig | undefined {
  return JOURNEY_STEPS.find(s => s.slug === slug);
}

/** Get the next step's label (for CTA buttons) */
export function getNextStepLabel(currentSlug: string): string {
  const idx = JOURNEY_STEPS.findIndex(s => s.slug === currentSlug);
  if (idx === -1 || idx === JOURNEY_STEPS.length - 1) return "إنهاء";
  return JOURNEY_STEPS[idx + 1].labelAr;
}

/** CTA label overrides for specific steps */
export const CTA_OVERRIDES: Record<string, string> = {
  "orientation": "ابدأ اختبار هولند",
  "certificate": "الخطوة التالية",
};

/** Get CTA label for a step's "Next" button */
export function getCtaLabel(currentSlug: string): string {
  return CTA_OVERRIDES[currentSlug] || `التالي — ${getNextStepLabel(currentSlug)}`;
}
