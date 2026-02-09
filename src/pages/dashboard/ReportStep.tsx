import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Briefcase, GraduationCap, TrendingUp, TrendingDown, Brain, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { analyzeSimulationTraits, TRAIT_LABELS, type TraitDimension } from "@/lib/traitMapping";

const MAJOR_LABELS: Record<string, string> = {
  MED_001: "الطب والجراحة", DENT_001: "طب الأسنان", PHARM_001: "الصيدلة",
  ENG_001: "هندسة البرمجيات", CIVIL_001: "الهندسة المدنية", IND_001: "الهندسة الصناعية",
  ARCH_001: "الهندسة المعمارية", CYBER_001: "الأمن السيبراني", AI_001: "الذكاء الاصطناعي",
  LAW_001: "القانون والمحاماة", BUS_001: "إدارة الأعمال", FIN_001: "المالية والاستثمار",
  HR_001: "الموارد البشرية", MKT_001: "التسويق الرقمي", MEDIA_001: "الإعلام والعلاقات العامة",
  PSY_001: "علم النفس", TRANS_001: "الترجمة واللغات", ART_001: "التصميم الجرافيكي",
};

const DIMENSION_COLORS: Record<TraitDimension, string> = {
  ethics: "hsl(var(--accent))", leadership: "hsl(142, 71%, 45%)", analytical: "hsl(221, 83%, 53%)",
  empathy: "hsl(280, 67%, 55%)", risk_action: "hsl(0, 84%, 60%)", creativity: "hsl(38, 92%, 50%)",
  compliance: "hsl(190, 70%, 45%)", commercial: "hsl(330, 65%, 50%)",
};

const DIMENSION_DESCRIPTIONS: Record<TraitDimension, string> = {
  ethics: "تتمسك بالمبادئ الأخلاقية وتضع النزاهة فوق المكاسب الشخصية. تتخذ قراراتك بناءً على ما هو صحيح وليس ما هو سهل.",
  leadership: "تبرز قدراتك القيادية في أصعب اللحظات. تتحمل المسؤولية وتوجه الفريق بثقة عندما تشتد الأزمات.",
  analytical: "تعتمد على البيانات والتحليل المنهجي في قراراتك. تبحث عن الأسباب الجذرية وتتحقق من المعلومات قبل التصرف.",
  empathy: "تمتلك حساسية عالية تجاه مشاعر الآخرين وتسعى لحل النزاعات بالحوار. تؤمن بقوة التعاون والعمل الجماعي.",
  risk_action: "لا تتردد في اتخاذ قرارات جريئة عندما يتطلب الموقف ذلك. تتحرك بسرعة وحسم حتى في ظل عدم اليقين.",
  creativity: "تبحث عن حلول مبتكرة وغير تقليدية للتحديات. تحول القيود إلى فرص وتجد مخارج ذكية من المواقف الصعبة.",
  compliance: "تلتزم بالإجراءات والبروتوكولات المعتمدة وتحرص على الدقة. تفضل الأمان والتخطيط المسبق على المجازفة.",
  commercial: "تهتم بالجوانب المالية والتجارية وتسعى لتحقيق أفضل عائد. تفهم ديناميكيات السوق وتتخذ قرارات موجهة بالنتائج.",
};

export default function ReportStep() {
  const { data: result, isLoading } = useQuery({
    queryKey: ["holland-result"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: hr } = await supabase
        .from("holland_results")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!hr) return null;

      const { data: codeData } = await supabase
        .from("holland_codes")
        .select("*")
        .eq("code", hr.top_code)
        .maybeSingle();

      return { ...hr, codeInfo: codeData };
    },
  });

  const { data: simAnalysis } = useQuery({
    queryKey: ["simulation-analysis"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: responses } = await supabase
        .from("simulation_responses")
        .select("selected_option_id, scenario_id")
        .eq("user_id", session.user.id);

      if (!responses?.length) return null;

      const scenarioIds = [...new Set(responses.map((r) => r.scenario_id))];
      const { data: scenarios } = await supabase
        .from("simulation_scenarios")
        .select("id, major_id, options_json")
        .in("id", scenarioIds);

      if (!scenarios?.length) return null;

      const traitScores = analyzeSimulationTraits(responses, scenarios);
      const completedMajors = [...new Set(scenarios.map((s) => s.major_id))];

      return { traitScores, completedMajors, totalResponses: responses.length };
    },
  });

  useEffect(() => {
    if (result) {
      confetti({
        particleCount: 150, spread: 100, origin: { y: 0.6 },
        colors: ["#faaa25", "#00a870", "#6966f2", "#051730"],
      });
    }
  }, [result]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">جاري تحضير التقرير...</div>;
  }

  if (!result) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">لم يتم العثور على نتائج</h2>
        <p className="text-muted-foreground">يرجى إكمال اختبار هولاند أولاً</p>
      </div>
    );
  }

  const scores = result.scores as Record<string, number>;
  const riasecLabels: Record<string, string> = {
    R: "واقعي", I: "بحثي", A: "فني", S: "اجتماعي", E: "مبادر", C: "تقليدي",
  };
  const maxScore = Math.max(...Object.values(scores).map(Number), 1);

  const maxTraitScore = simAnalysis
    ? Math.max(...simAnalysis.traitScores.map((t) => t.score), 1)
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-accent" />
        </div>
        <h2 className="text-3xl font-bold mb-2">تقريرك المهني</h2>
        <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg text-2xl font-bold mt-2">
          {result.top_code}
        </div>
      </div>

      {/* Code description */}
      {result.codeInfo && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <h3 className="text-xl font-bold mb-2">{result.codeInfo.description}</h3>
        </div>
      )}

      {/* RIASEC Scores Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">ملخص الدرجات</h3>
        <div className="space-y-3">
          {["R", "I", "A", "S", "E", "C"].map((code) => {
            const score = Number(scores[code] || 0);
            const pct = (score / maxScore) * 100;
            return (
              <div key={code} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium">{riasecLabels[code]}</span>
                <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
                <span className="w-8 text-sm text-muted-foreground text-left">{score}/7</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      {result.codeInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <h3 className="font-bold">نقاط القوة</h3>
            </div>
            <ul className="space-y-2">
              {(result.codeInfo.strengths as string[])?.map((s: string, i: number) => (
                <li key={i} className="text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <h3 className="font-bold">نقاط الضعف</h3>
            </div>
            <ul className="space-y-2">
              {(result.codeInfo.weaknesses as string[])?.map((w: string, i: number) => (
                <li key={i} className="text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Career & Major recommendations */}
      {result.codeInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-accent" />
              <h3 className="font-bold">مسارات مهنية مقترحة</h3>
            </div>
            <ul className="space-y-2">
              {(result.codeInfo.career_paths as string[])?.map((c: string, i: number) => (
                <li key={i} className="text-muted-foreground">• {c}</li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-link" />
              <h3 className="font-bold">تخصصات موصى بها</h3>
            </div>
            <ul className="space-y-2">
              {(result.codeInfo.recommended_majors as string[])?.map((m: string, i: number) => (
                <li key={i} className="text-muted-foreground">• {m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ============ SIMULATION ANALYSIS ============ */}
      {simAnalysis && simAnalysis.traitScores.some((t) => t.score > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="text-center pt-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">تحليل المحاكاة المهنية</h2>
            <p className="text-muted-foreground mt-1">بناءً على قراراتك في {simAnalysis.totalResponses} موقف مهني</p>
          </div>

          {/* Dimension Bars */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">ملامح شخصيتك المهنية</h3>
            <div className="space-y-3">
              {simAnalysis.traitScores.map((t, i) => {
                const pct = (t.score / maxTraitScore) * 100;
                return (
                  <div key={t.key} className="flex items-center gap-3">
                    <span className="w-32 text-sm font-medium text-right truncate">{t.label}</span>
                    <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: DIMENSION_COLORS[t.key] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 3 Traits */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              أبرز سماتك
            </h3>
            {simAnalysis.traitScores
              .filter((t) => t.score > 0)
              .slice(0, 3)
              .map((t, i) => (
                <motion.div
                  key={t.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="bg-card border border-border rounded-lg p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DIMENSION_COLORS[t.key] }} />
                    <h4 className="font-bold text-base">{t.label}</h4>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{DIMENSION_DESCRIPTIONS[t.key]}</p>
                </motion.div>
              ))}
          </div>

          {/* Completed Majors */}
          {simAnalysis.completedMajors.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3">المسارات التي استكشفتها</h3>
              <div className="flex flex-wrap gap-2">
                {simAnalysis.completedMajors.map((majorId) => (
                  <span
                    key={majorId}
                    className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {MAJOR_LABELS[majorId] || majorId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
