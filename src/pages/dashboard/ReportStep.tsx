import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Briefcase, GraduationCap, TrendingUp, TrendingDown } from "lucide-react";
import confetti from "canvas-confetti";

export default function ReportStep() {
  const { data: result, isLoading } = useQuery({
    queryKey: ["holland-result"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get holland result
      const { data: hr } = await supabase
        .from("holland_results")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!hr) return null;

      // Fetch matching holland code description
      const { data: codeData } = await supabase
        .from("holland_codes")
        .select("*")
        .eq("code", hr.top_code)
        .maybeSingle();

      return { ...hr, codeInfo: codeData };
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
    R: "واقعي",
    I: "بحثي",
    A: "فني",
    S: "اجتماعي",
    E: "مبادر",
    C: "تقليدي",
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
    </motion.div>
  );
}
