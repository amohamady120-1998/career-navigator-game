import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import {
  Trophy, Briefcase, GraduationCap, TrendingUp, TrendingDown, Brain, Sparkles,
  Download, Share2, Copy, FileText, BarChart3, Gamepad2, CheckCircle2, ArrowLeft,
  MessageSquare, Link2, Unlink2, User, School, AlertCircle, Printer
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { analyzeSimulationTraits, type TraitDimension } from "@/lib/traitMapping";

const COMFORT_LABELS: Record<string, string> = {
  very_comfortable: "مريح جدًا",
  ok: "مقبول",
  hesitant: "متردد",
  not_comfortable: "مش مريح",
};

const STAGE_LABELS: Record<string, string> = {
  year1: "السنة الأولى",
  year2: "السنة الثانية",
  year3: "السنة الثالثة",
  year4: "السنة الرابعة",
  post_grad: "بعد التخرج",
};

const TRAIT_FRIENDLY: Record<string, string> = {
  ethics: "تميل للقرارات الأخلاقية المبنية على المبادئ",
  leadership: "تبرز قيادتك في اللحظات الصعبة",
  analytical: "تعتمد على التحليل والبيانات في قراراتك",
  empathy: "تتميز بتعاطفك وفهمك لمشاعر الآخرين",
  risk_action: "لا تتردد في اتخاذ قرارات جريئة",
  creativity: "تبحث دائمًا عن حلول مبتكرة وغير تقليدية",
  compliance: "تلتزم بالإجراءات وتفضل التخطيط المسبق",
  commercial: "تفكر دائمًا بالجوانب التجارية والعائد",
};

const DOUBT_LABELS: Record<number, string> = {
  1: "حاسس إن ده مكاني!",
  2: "عندي شوية أسئلة",
  3: "مش مرتاح، عايز أعيد",
};

const DIMENSION_COLORS: Record<string, string> = {
  ethics: "hsl(var(--accent))", leadership: "hsl(142, 71%, 45%)", analytical: "hsl(221, 83%, 53%)",
  empathy: "hsl(280, 67%, 55%)", risk_action: "hsl(0, 84%, 60%)", creativity: "hsl(38, 92%, 50%)",
  compliance: "hsl(190, 70%, 45%)", commercial: "hsl(330, 65%, 50%)",
};

export default function FinalReport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // 1. Profile
  const { data: profile } = useQuery({
    queryKey: ["final-profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from("profiles").select("full_name, school_name, grade_level, phone").eq("user_id", session.user.id).maybeSingle();
      return data;
    },
  });

  // 2. Pre-impact & Post-impact
  const { data: impactData } = useQuery({
    queryKey: ["final-impact"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from("impact_assessments").select("*").eq("user_id", session.user.id);
      return data;
    },
  });

  // 3. Holland results + code info
  const { data: hollandResult } = useQuery({
    queryKey: ["final-holland"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data: hr } = await supabase.from("holland_results").select("*").eq("user_id", session.user.id).maybeSingle();
      if (!hr) return null;
      const { data: codeData } = await supabase.from("holland_codes").select("*").eq("code", hr.top_code).maybeSingle();
      return { ...hr, codeInfo: codeData };
    },
  });

  // 4. Shortlist
  const { data: shortlist } = useQuery({
    queryKey: ["final-shortlist"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from("student_shortlist").select("*").eq("user_id", session.user.id).maybeSingle();
      if (!data) return null;
      const majorIds = (data.ranking_ids as string[])?.length ? data.ranking_ids as string[] : data.major_ids as string[];
      if (!majorIds?.length) return null;
      const { data: majors } = await supabase.from("majors").select("id, name_ar").in("id", majorIds);
      // Return in ranked order
      return majorIds.map(id => majors?.find(m => m.id === id)).filter(Boolean) as { id: string; name_ar: string }[];
    },
  });

  // 5. Excluded majors (from user_progress meta_data)
  const { data: excludedMajors } = useQuery({
    queryKey: ["final-excluded"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data: step } = await supabase.from("journey_steps").select("id").eq("slug", "excluded-majors").maybeSingle();
      if (!step) return null;
      const { data: progress } = await supabase.from("user_progress").select("meta_data").eq("user_id", session.user.id).eq("step_id", step.id).maybeSingle();
      if (!progress?.meta_data) return null;
      return (progress.meta_data as any).excluded_majors as { name: string; shortReason: string }[] | null;
    },
  });

  // 6. Doubt checkpoint
  const { data: doubtData } = useQuery({
    queryKey: ["final-doubt"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data: step } = await supabase.from("journey_steps").select("id").eq("slug", "doubt-checkpoint").maybeSingle();
      if (!step) return null;
      const { data: progress } = await supabase.from("user_progress").select("meta_data").eq("user_id", session.user.id).eq("step_id", step.id).maybeSingle();
      if (!progress?.meta_data) return null;
      return progress.meta_data as { doubt_level?: number; label?: string };
    },
  });

  // 7. Explore responses
  const { data: exploreData } = useQuery({
    queryKey: ["final-explore"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from("major_explore_responses").select("stage_key, comfort_level, major_id").eq("user_id", session.user.id);
      return data;
    },
  });

  // 8. Simulation analysis (try DB first, then fallback to meta_data)
  const { data: simAnalysis } = useQuery({
    queryKey: ["final-simulation"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      // Try simulation_responses table first
      const { data: responses } = await supabase.from("simulation_responses").select("selected_option_id, scenario_id").eq("user_id", session.user.id);
      if (responses?.length) {
        const scenarioIds = [...new Set(responses.map(r => r.scenario_id))];
        const { data: scenarios } = await supabase.from("simulation_scenarios").select("id, major_id, options_json").in("id", scenarioIds);
        if (scenarios?.length) {
          const traitScores = analyzeSimulationTraits(responses, scenarios);
          const completedMajors = [...new Set(scenarios.map(s => s.major_id))];
          return { traitScores, totalResponses: responses.length, completedMajors };
        }
      }
      
      // Fallback: read from user_progress meta_data for simulation step
      const { data: step } = await supabase.from("journey_steps").select("id").eq("slug", "simulation").maybeSingle();
      if (!step) return null;
      const { data: progress } = await supabase.from("user_progress").select("meta_data").eq("user_id", session.user.id).eq("step_id", step.id).maybeSingle();
      if (!progress?.meta_data) return null;
      
      const meta = progress.meta_data as any;
      if (!meta.total_responses || meta.total_responses === 0) return null;
      
      // Build trait scores from meta_data trait_counts
      const traitCounts = meta.trait_counts as Record<string, number> || {};
      const TRAIT_MAP: Record<string, { label: string; key: string }> = {
        action: { key: "leadership", label: "القيادة والمبادرة" },
        analytical: { key: "analytical", label: "التحليل والمنطق" },
        cautious: { key: "compliance", label: "الحذر والالتزام" },
        seek_info: { key: "analytical", label: "التحليل والمنطق" },
        risk: { key: "risk_action", label: "الجرأة والمخاطرة" },
        safe: { key: "compliance", label: "الحذر والالتزام" },
      };
      
      const scoreMap: Record<string, { key: string; label: string; score: number }> = {};
      Object.entries(traitCounts).forEach(([trait, count]) => {
        const mapped = TRAIT_MAP[trait];
        if (mapped) {
          if (!scoreMap[mapped.key]) scoreMap[mapped.key] = { key: mapped.key, label: mapped.label, score: 0 };
          scoreMap[mapped.key].score += count;
        }
      });
      
      const traitScores = Object.values(scoreMap).sort((a, b) => b.score - a.score);
      return { traitScores, totalResponses: meta.total_responses, completedMajors: [] };
    },
  });

  // 9. Existing share token
  const { data: existingReport } = useQuery({
    queryKey: ["final-report-record"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from("final_reports").select("*").eq("user_id", session.user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existingReport?.share_token) setShareToken(existingReport.share_token);
  }, [existingReport]);

  // Confetti + mark completed
  useEffect(() => {
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: ["#faaa25", "#00a870", "#6966f2", "#051730"] });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: step } = await supabase.from("journey_steps").select("id").eq("slug", "report").maybeSingle();
      if (step) {
        await supabase.from("user_progress").upsert(
          { user_id: session.user.id, step_id: step.id, status: "completed", completed_at: new Date().toISOString() },
          { onConflict: "user_id,step_id" }
        );
        queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

      }

      // Upsert final_reports payload
      const payload = {
        holland_code: hollandResult?.top_code || null,
        shortlist_count: shortlist?.length || 0,
        explore_stages: exploreData?.length || 0,
        sim_responses: simAnalysis?.totalResponses || 0,
      };
      await supabase.from("final_reports").upsert(
        { user_id: session.user.id, payload },
        { onConflict: "user_id" }
      );
    })();
  }, []);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (shareToken) { setShareModalOpen(true); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await supabase.from("final_reports").upsert(
      { user_id: session.user.id, share_token: token, payload: {} },
      { onConflict: "user_id" }
    );
    setShareToken(token);
    setShareModalOpen(true);
  };

  const handleRevokeShare = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from("final_reports").upsert(
        { user_id: session.user.id, share_token: null, payload: {} },
        { onConflict: "user_id" }
      );
      setShareToken(null);
      setShareModalOpen(false);
      toast.success("تم إلغاء رابط المشاركة بنجاح");
    } catch {
      toast.error("حدث خطأ في إلغاء المشاركة");
    }
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/share/report/${shareToken}`);
    toast.success("تم نسخ الرابط!");
    setShareModalOpen(false);
  };

  // Computed data
  const preAssessment = impactData?.find(a => a.assessment_type === "pre");
  const postAssessment = impactData?.find(a => a.assessment_type === "post");
  const preScore = preAssessment?.score_json as { percentage?: number } | null;
  const postScore = postAssessment?.score_json as { percentage?: number } | null;

  const riasecLabels: Record<string, string> = { R: "واقعي", I: "بحثي", A: "فني", S: "اجتماعي", E: "مبادر", C: "تقليدي" };
  const scores = hollandResult?.scores as Record<string, number> | undefined;
  const maxScore = scores ? Math.max(...Object.values(scores).map(Number), 1) : 1;
  const topTraits = simAnalysis?.traitScores?.filter(t => t.score > 0).slice(0, 3) || [];
  const maxTraitScore = simAnalysis ? Math.max(...(simAnalysis.traitScores?.map(t => t.score) || [1]), 1) : 1;

  return (
    <div ref={printRef} className="print:bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8 pb-12">

        {/* ===== HEADER ===== */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-2">تقريرك النهائي الشامل</h1>
          <p className="text-muted-foreground">ملخص كامل لرحلتك في اكتشاف ذاتك المهنية</p>
          <div className="flex justify-center gap-3 mt-4 print:hidden flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> طباعة التقرير
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleShare}>
              <Share2 className="w-4 h-4" /> مشاركة التقرير
            </Button>
            {shareToken && (
              <Button variant="destructive" className="gap-2" onClick={handleRevokeShare}>
                <Unlink2 className="w-4 h-4" /> إلغاء المشاركة
              </Button>
            )}
          </div>
        </div>

        {/* ===== 1. PROFILE INFO ===== */}
        {profile && (
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> بياناتك الشخصية
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.full_name && (
                <div className="bg-secondary/30 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">الاسم</p>
                  <p className="font-bold text-foreground">{profile.full_name}</p>
                </div>
              )}
              {profile.school_name && (
                <div className="bg-secondary/30 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">المدرسة</p>
                  <p className="font-bold text-foreground">{profile.school_name}</p>
                </div>
              )}
              {profile.grade_level && (
                <div className="bg-secondary/30 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">المرحلة الدراسية</p>
                  <p className="font-bold text-foreground">{profile.grade_level}</p>
                </div>
              )}
              {profile.phone && (
                <div className="bg-secondary/30 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">رقم الهاتف</p>
                  <p className="font-bold text-foreground">{profile.phone}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ===== 2. HERO SUMMARY ===== */}
        <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" /> الصورة الكبيرة
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            {hollandResult?.top_code && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>نمطك المهني الأساسي هو <strong className="text-foreground">{hollandResult.top_code}</strong> — مزيج يعكس اهتماماتك وطريقة تفكيرك</span>
              </li>
            )}
            {shortlist && shortlist.length > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>اخترت {shortlist.length} تخصصات تناسب ميولك وترتيبك الشخصي</span>
              </li>
            )}
            {exploreData && exploreData.length > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>استكشفت واقع التخصص عبر {exploreData.length} مرحلة تفاعلية</span>
              </li>
            )}
            {simAnalysis && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>اتخذت قرارات في {simAnalysis.totalResponses} موقف مهني محاكي</span>
              </li>
            )}
            {doubtData?.doubt_level && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>في لحظة الصدق، قلت: <strong className="text-foreground">{DOUBT_LABELS[doubtData.doubt_level] || doubtData.label}</strong></span>
              </li>
            )}
            {preScore && postScore && (postScore.percentage ?? 0) > (preScore.percentage ?? 0) && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>ارتفع وعيك بنسبة <strong className="text-foreground">{(postScore.percentage ?? 0) - (preScore.percentage ?? 0)}%</strong> بعد الرحلة</span>
              </li>
            )}
          </ul>
        </Card>

        {/* ===== 3. HOLLAND SCORES ===== */}
        {hollandResult && scores && (
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> نتائج اختبار الميول المهنية (هولاند)
            </h2>
            <div className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-lg text-xl font-bold mb-4">
              {hollandResult.top_code}
            </div>
            {hollandResult.codeInfo?.description && (
              <p className="text-muted-foreground mb-4">{hollandResult.codeInfo.description}</p>
            )}
            <div className="space-y-3">
              {["R", "I", "A", "S", "E", "C"].map((code) => {
                const score = Number(scores[code] || 0);
                const pct = (score / maxScore) * 100;
                return (
                  <div key={code} className="flex items-center gap-3">
                    <span className="w-16 text-sm font-medium">{riasecLabels[code]}</span>
                    <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-accent rounded-full" />
                    </div>
                    <span className="w-8 text-sm text-muted-foreground">{score}/7</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ===== 4. STRENGTHS & WEAKNESSES ===== */}
        {hollandResult?.codeInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-success" />
                <h3 className="font-bold">نقاط القوة</h3>
              </div>
              <ul className="space-y-2">
                {(hollandResult.codeInfo.strengths as string[])?.map((s: string, i: number) => (
                  <li key={i} className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-success rounded-full shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <h3 className="font-bold">نقاط التطوير</h3>
              </div>
              <ul className="space-y-2">
                {(hollandResult.codeInfo.weaknesses as string[])?.map((w: string, i: number) => (
                  <li key={i} className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-destructive rounded-full shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* ===== 5. CAREER & MAJOR RECOMMENDATIONS ===== */}
        {hollandResult?.codeInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5 text-accent" />
                <h3 className="font-bold">مسارات مهنية مقترحة</h3>
              </div>
              <ul className="space-y-2">
                {(hollandResult.codeInfo.career_paths as string[])?.map((c: string, i: number) => (
                  <li key={i} className="text-muted-foreground text-sm">• {c}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="font-bold">تخصصات موصى بها</h3>
              </div>
              <ul className="space-y-2">
                {(hollandResult.codeInfo.recommended_majors as string[])?.map((m: string, i: number) => (
                  <li key={i} className="text-muted-foreground text-sm">• {m}</li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* ===== 6. TOP RANKED MAJORS (Shortlist) ===== */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent" /> ترتيب اختياراتك النهائية
          </h2>
          {shortlist && shortlist.length > 0 ? (
            <div className="space-y-3">
              {shortlist.map((major, i) => (
                <Card key={major.id} className="p-5 border border-border flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{major.name_ar}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      تم اختياره بناءً على ترتيبك الشخصي وتوافقه مع نمطك المهني
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 border border-border text-center text-muted-foreground">
              ستظهر اختياراتك هنا بعد إكمال مرحلة الترتيب.
            </Card>
          )}
        </div>

        {/* ===== 7. EXCLUDED MAJORS ===== */}
        {excludedMajors && excludedMajors.length > 0 && (
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> تخصصات أقل توافقًا معك حاليًا
            </h2>
            <div className="space-y-3">
              {excludedMajors.map((major, i) => (
                <div key={i} className="bg-secondary/30 rounded-lg px-4 py-3">
                  <h4 className="font-bold text-sm mb-1">{major.name}</h4>
                  <p className="text-sm text-muted-foreground">{major.shortReason}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ===== 8. DOUBT CHECKPOINT ===== */}
        {doubtData?.doubt_level && (
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              💭 لحظة الصدق
            </h2>
            <div className="bg-secondary/30 rounded-lg px-4 py-3">
              <p className="text-sm text-muted-foreground mb-1">إحساسك بعد ما شوفت نتائجك:</p>
              <p className="font-bold text-foreground text-lg">{DOUBT_LABELS[doubtData.doubt_level] || doubtData.label}</p>
            </div>
          </Card>
        )}

        {/* ===== 9. EXPLORE INSIGHTS ===== */}
        {exploreData && exploreData.length > 0 && (
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" /> كيف كان إحساسك مع واقع التخصص سنة بسنة؟
            </h2>
            <div className="space-y-3">
              {["year1", "year2", "year3", "year4", "post_grad"].map((stage) => {
                const response = exploreData.find(r => r.stage_key === stage);
                if (!response) return null;
                return (
                  <div key={stage} className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-3">
                    <span className="font-medium text-sm">{STAGE_LABELS[stage]}</span>
                    <span className={`text-sm font-bold ${
                      response.comfort_level === "very_comfortable" ? "text-success" :
                      response.comfort_level === "ok" ? "text-accent" :
                      response.comfort_level === "hesitant" ? "text-amber-500" :
                      "text-destructive"
                    }`}>
                      {COMFORT_LABELS[response.comfort_level] || response.comfort_level}
                    </span>
                  </div>
                );
              })}
              {(() => {
                const mostComfortable = exploreData.reduce((best, curr) => {
                  const order = ["very_comfortable", "ok", "hesitant", "not_comfortable"];
                  return order.indexOf(curr.comfort_level) < order.indexOf(best.comfort_level) ? curr : best;
                }, exploreData[0]);
                return (
                  <p className="text-sm text-muted-foreground mt-2">
                    أكثر مرحلة شعرت فيها بالراحة: <strong className="text-foreground">{STAGE_LABELS[mostComfortable.stage_key]}</strong>
                  </p>
                );
              })()}
            </div>
          </Card>
        )}

        {/* ===== 10. SIMULATION INSIGHTS ===== */}
        {simAnalysis && simAnalysis.traitScores?.some(t => t.score > 0) && (
          <Card className="p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" /> تحليل المحاكاة المهنية
            </h2>
            <p className="text-sm text-muted-foreground mb-4">بناءً على قراراتك في {simAnalysis.totalResponses} موقف مهني</p>

            {/* All trait bars */}
            <div className="space-y-3 mb-6">
              {simAnalysis.traitScores.map((t, i) => {
                const pct = (t.score / maxTraitScore) * 100;
                return (
                  <div key={t.key} className="flex items-center gap-3">
                    <span className="w-28 text-sm font-medium text-right truncate">{t.label}</span>
                    <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: DIMENSION_COLORS[t.key] || "hsl(var(--accent))" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top 3 traits */}
            {topTraits.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" /> أبرز سماتك
                </h3>
                {topTraits.map((t) => (
                  <div key={t.key} className="bg-secondary/30 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DIMENSION_COLORS[t.key] || "hsl(var(--accent))" }} />
                      <h4 className="font-bold text-sm">{t.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{TRAIT_FRIENDLY[t.key] || "سمة بارزة في شخصيتك المهنية"}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ===== 11. IMPACT COMPARISON ===== */}
        <Card className="p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" /> التغير في وعيك بعد الرحلة
          </h2>
          {preScore && postScore ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">قبل الرحلة</p>
                  <p className="text-3xl font-bold text-foreground">{preScore.percentage}%</p>
                </div>
                <div className="bg-success/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">بعد الرحلة</p>
                  <p className="text-3xl font-bold text-success">{postScore.percentage}%</p>
                </div>
              </div>
              {(postScore.percentage ?? 0) > (preScore.percentage ?? 0) && (
                <p className="text-sm text-success font-medium text-center">
                  ارتفع وعيك بنسبة {(postScore.percentage ?? 0) - (preScore.percentage ?? 0)}% بعد إكمال الرحلة 🎉
                </p>
              )}
            </div>
          ) : postScore ? (
            <div className="space-y-3">
              <div className="bg-success/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">درجة الوعي الحالية</p>
                <p className="text-3xl font-bold text-success">{postScore.percentage}%</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">لم يتم إكمال قياس الأثر القبلي للمقارنة.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">أكمل قياس الأثر البعدي لرؤية نتائجك هنا.</p>
          )}
        </Card>

        {/* ===== 12. CONVERSION CTAs ===== */}
        <div className="space-y-3 print:hidden">
          <Button size="lg" className="w-full h-14 text-lg font-bold rounded-xl btn-gradient gap-2" onClick={() => navigate("/dashboard/consultation")}>
            <MessageSquare className="w-5 h-5" /> احجز استشارة الآن
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 rounded-xl gap-2" onClick={() => navigate("/dashboard/shortlist")}>
              استكشف التخصصات مرة أخرى
            </Button>
            <Button variant="outline" className="h-12 rounded-xl gap-2" onClick={() => navigate("/dashboard/certificate")}>
              <FileText className="w-4 h-4" /> إصدار الشهادة
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>مشاركة التقرير النهائي</DialogTitle>
            <DialogDescription>
              هذا الرابط آمن وخاص بك. أي شخص يمتلك الرابط يمكنه رؤية التقرير فقط.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 bg-muted p-3 rounded-lg text-sm text-muted-foreground break-all font-mono">
              {`${window.location.origin}/share/report/${shareToken}`}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full mt-3">إغلاق</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
