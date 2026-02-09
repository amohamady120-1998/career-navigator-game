import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Briefcase, GraduationCap, TrendingUp, TrendingDown, Brain, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { computeDimensionScores, MAJOR_LABELS, type DimensionScore } from "@/lib/traitMapping";

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

      // Get user's simulation responses
      const { data: responses } = await supabase
        .from("simulation_responses")
        .select("selected_option_id, scenario_id")
        .eq("user_id", session.user.id);

      if (!responses?.length) return null;

      // Get the scenarios to extract ai_tags from options_json
      const scenarioIds = [...new Set(responses.map((r) => r.scenario_id))];
      const { data: scenarios } = await supabase
        .from("simulation_scenarios")
        .select("id, major_id, options_json")
        .in("id", scenarioIds);

      if (!scenarios?.length) return null;

      // Build a lookup: scenarioId -> { optionId -> ai_tag }
      const scenarioMap = new Map<string, { majorId: string; optionTags: Record<string, string> }>();
      scenarios.forEach((s) => {
        const opts = s.options_json as Array<{ id: string; ai_tag: string }>;
        const optionTags: Record<string, string> = {};
        opts.forEach((o) => { optionTags[o.id] = o.ai_tag; });
        scenarioMap.set(s.id, { majorId: s.major_id, optionTags });
      });

      // Collect selected ai_tags and completed majors
      const selectedTags: string[] = [];
      const completedMajors = new Set<string>();

      responses.forEach((r) => {
        const scenario = scenarioMap.get(r.scenario_id);
        if (!scenario) return;
        completedMajors.add(scenario.majorId);
        const tag = scenario.optionTags[r.selected_option_id];
        if (tag) selectedTags.push(tag);
      });

      const scores = computeDimensionScores(selectedTags);
      return { scores, completedMajors: Array.from(completedMajors), totalResponses: selectedTags.length };
    },
  });

  // Confetti on load
  useEffect(() => {
    if (result) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
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
      {simAnalysis && simAnalysis.scores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Section Header */}
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
              {simAnalysis.scores.map((s: DimensionScore, i: number) => (
                <div key={s.dimension.key} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-right truncate">{s.dimension.labelAr}</span>
                  <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.dimension.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Traits */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              أبرز سماتك
            </h3>
            {simAnalysis.scores
              .filter((s: DimensionScore) => s.count > 0)
              .slice(0, 3)
              .map((s: DimensionScore, i: number) => (
                <motion.div
                  key={s.dimension.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className="bg-card border border-border rounded-lg p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.dimension.color }} />
                    <h4 className="font-bold text-base">{s.dimension.labelAr}</h4>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.dimension.description}</p>
                </motion.div>
              ))}
          </div>

          {/* Completed Majors */}
          {simAnalysis.completedMajors.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3">المسارات التي استكشفتها</h3>
              <div className="flex flex-wrap gap-2">
                {simAnalysis.completedMajors.map((majorId: string) => (
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
