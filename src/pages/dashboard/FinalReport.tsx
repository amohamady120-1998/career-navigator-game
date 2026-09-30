import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import {
  Trophy, Briefcase, GraduationCap, TrendingUp, TrendingDown, Brain, Sparkles,
  Download, Share2, Copy, FileText, BarChart3, Gamepad2, CheckCircle2, ArrowLeft,
  MessageSquare, Link2, Unlink2, User, School, AlertCircle, Printer
} from "lucide-react";
import { toast } from "sonner";
import { AtharMark } from "@/components/AtharLogo";
import { RadarChart } from "@/components/RadarChart";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";
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

  const awarenessDelta =
    preScore && postScore ? (postScore.percentage ?? 0) - (preScore.percentage ?? 0) : null;
  const destination = shortlist?.[0]?.name_ar;
  const reportDate = new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const doubtText = doubtData?.doubt_level ? DOUBT_LABELS[doubtData.doubt_level] || doubtData.label : null;

  return (
    <div ref={printRef} className="print:bg-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="athar-page">
        <article className="overflow-hidden rounded-[22px] border border-border bg-card shadow-premium-lg">
          {/* ===== HERO ===== */}
          <header className="hero-band mb-0 rounded-none p-7">
            <div className="mb-[22px] flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-hero-muted">
                <AtharMark className="h-7 w-7 rounded-lg" /> تقرير أثر البداية
              </span>
              <span className="text-[0.82rem] font-medium text-hero-subtle">{reportDate}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1.5 text-[0.82rem] font-bold text-accent">
                  {destination ? "وجهتك الأقرب" : "تقريرك النهائي الشامل"}
                </div>
                <h1 className="mb-2.5 text-[clamp(1.7rem,4.6vw,2.4rem)] font-extrabold leading-[1.1] tracking-tight">
                  {destination ?? "ملخص رحلتك"}
                </h1>
                <p className="m-0 max-w-[38ch] font-normal leading-relaxed text-hero-muted">
                  {hollandResult?.top_code ? (
                    <>
                      نمطك المهني الأساسي هو <b className="font-bold text-hero-foreground">{hollandResult.top_code}</b> — مزيج يعكس اهتماماتك وطريقة تفكيرك
                    </>
                  ) : (
                    "ملخص كامل لرحلتك في اكتشاف ذاتك المهنية"
                  )}
                </p>
              </div>
              {hollandResult?.top_code && (
                <div className="flex-none text-center">
                  <div className="btn-gradient grid h-[74px] w-[74px] place-items-center rounded-full text-xl font-black shadow-premium-lg" dir="ltr">
                    {hollandResult.top_code}
                  </div>
                  <span className="mt-1.5 block text-[0.76rem] font-semibold text-hero-subtle">نمطك</span>
                </div>
              )}
            </div>
            {profile && (
              <div className="mt-[22px] border-t border-hero-foreground/10 pt-4 text-sm font-medium text-hero-subtle">
                {[profile.full_name, profile.grade_level, profile.school_name, profile.phone].filter(Boolean).join(" · ")}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" className={heroBtn} onClick={handlePrint}>
                <Printer className="h-4 w-4" /> طباعة التقرير
              </Button>
              <Button variant="outline" size="sm" className={heroBtn} onClick={handleShare}>
                <Share2 className="h-4 w-4" /> مشاركة التقرير
              </Button>
              {shareToken && (
                <Button variant="destructive" size="sm" className="gap-2 rounded-[10px] font-bold" onClick={handleRevokeShare}>
                  <Unlink2 className="h-4 w-4" /> إلغاء المشاركة
                </Button>
              )}
            </div>
          </header>

          <div className="p-5 md:p-6">
            {/* ===== RADAR ===== */}
            {hollandResult && scores && (
              <section className="mb-4 text-center">
                <div className="mb-1 text-[0.82rem] font-bold text-muted-foreground">بصمتك المهنية · نتائج اختبار الميول (هولاند)</div>
                <RadarChart values={scores} max={maxScore} />
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {["R", "I", "A", "S", "E", "C"].map((code) => (
                    <span key={code} className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      {riasecLabels[code]} {Number(scores[code] || 0)}/7
                    </span>
                  ))}
                </div>
                {hollandResult.codeInfo?.description && (
                  <p className="mx-auto mt-3 max-w-[60ch] text-sm text-muted-foreground">{hollandResult.codeInfo.description}</p>
                )}
              </section>
            )}

            {/* ===== STRIP ===== */}
            <div className="my-[22px] grid grid-cols-2 overflow-hidden rounded-[14px] border border-border bg-muted/40 sm:grid-cols-5">
              <StripCell value={<span dir="ltr">{hollandResult?.top_code ?? "—"}</span>} label="نمطك الأساسي" />
              <StripCell value={toArabicDigits(shortlist?.length ?? 0)} label="تخصصات اخترتها" />
              <StripCell value={toArabicDigits(simAnalysis?.totalResponses ?? 0)} label="مواقف محاكاة" />
              <StripCell
                value={awarenessDelta !== null ? `${awarenessDelta > 0 ? "↑ " : ""}${toArabicDigits(awarenessDelta)}٪` : "—"}
                label="ارتفاع وعيك"
                tone="success"
              />
              <StripCell value={doubtText ? "♥" : "—"} label={doubtText ? `«${doubtText}»` : "لحظة الصدق"} tone="accent" />
            </div>

            {/* ===== BIG PICTURE ===== */}
            <ReportSection icon={Sparkles} title="الصورة الكبيرة">
              <ul className="flex flex-col gap-[9px]">
                {hollandResult?.top_code && (
                  <Bullet>نمطك المهني الأساسي هو <strong>{hollandResult.top_code}</strong> — مزيج يعكس اهتماماتك وطريقة تفكيرك</Bullet>
                )}
                {shortlist && shortlist.length > 0 && <Bullet>اخترت {shortlist.length} تخصصات تناسب ميولك وترتيبك الشخصي</Bullet>}
                {exploreData && exploreData.length > 0 && <Bullet>استكشفت واقع التخصص عبر {exploreData.length} مرحلة تفاعلية</Bullet>}
                {simAnalysis && <Bullet>اتخذت قرارات في {simAnalysis.totalResponses} موقف مهني محاكي</Bullet>}
                {doubtText && <Bullet>في لحظة الصدق، قلت: <strong>{doubtText}</strong></Bullet>}
                {awarenessDelta !== null && awarenessDelta > 0 && (
                  <Bullet>ارتفع وعيك بنسبة <strong>{awarenessDelta}%</strong> بعد الرحلة</Bullet>
                )}
              </ul>
            </ReportSection>

            {/* ===== STRENGTHS & WEAKNESSES ===== */}
            {hollandResult?.codeInfo && (
              <ReportSection icon={Brain} title="نقاط القوة والتطوير">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="rounded-[14px] border border-border p-[18px]">
                    <div className="mb-[13px] flex items-center gap-2 font-extrabold text-success">
                      <TrendingUp className="h-[18px] w-[18px]" /> نقاط القوة
                    </div>
                    <ul className="flex flex-col gap-[11px]">
                      {(hollandResult.codeInfo.strengths as string[])?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-[0.92rem] font-medium leading-normal">
                          <span className="mt-px grid h-[19px] w-[19px] flex-none place-items-center rounded-full bg-success/15 text-success">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[14px] border border-border p-[18px]">
                    <div className="mb-[13px] flex items-center gap-2 font-extrabold text-[hsl(var(--gradient-end))]">
                      <TrendingDown className="h-[18px] w-[18px]" /> نقاط التطوير
                    </div>
                    <ul className="flex flex-col gap-[11px]">
                      {(hollandResult.codeInfo.weaknesses as string[])?.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-[0.92rem] font-medium leading-normal">
                          <span className="mt-px grid h-[19px] w-[19px] flex-none place-items-center rounded-full bg-accent/15 text-[hsl(var(--gradient-end))]">
                            <ArrowLeft className="h-3 w-3" />
                          </span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ReportSection>
            )}

            {/* ===== IMPACT COMPARISON ===== */}
            <ReportSection icon={BarChart3} title="التغير في وعيك بعد الرحلة">
              {preScore && postScore ? (
                <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-success/25 bg-success/5 p-[22px]">
                  <div className="min-w-[200px] flex-1">
                    <ImpactBar label="قبل الرحلة" value={preScore.percentage ?? 0} tone="before" />
                    <ImpactBar label="بعد الرحلة" value={postScore.percentage ?? 0} tone="after" className="mt-3" />
                  </div>
                  {awarenessDelta !== null && awarenessDelta > 0 && (
                    <div className="text-center">
                      <b className="block text-[2.2rem] font-black leading-none text-success">+{toArabicDigits(awarenessDelta)}٪</b>
                      <span className="text-[0.8rem] font-semibold text-muted-foreground">ارتفاع الوعي 🎉</span>
                    </div>
                  )}
                </div>
              ) : postScore ? (
                <div className="space-y-3">
                  <div className="rounded-[14px] bg-success/10 p-4 text-center">
                    <p className="mb-1 text-sm text-muted-foreground">درجة الوعي الحالية</p>
                    <p className="text-3xl font-black text-success">{postScore.percentage}%</p>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">لم يتم إكمال قياس الأثر القبلي للمقارنة.</p>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">أكمل قياس الأثر البعدي لرؤية نتائجك هنا.</p>
              )}
            </ReportSection>

            {/* ===== SIMULATION INSIGHTS ===== */}
            {simAnalysis && simAnalysis.traitScores?.some(t => t.score > 0) && (
              <ReportSection icon={Gamepad2} title="تحليل المحاكاة المهنية">
                <p className="-mt-1.5 mb-3.5 text-[0.9rem] text-muted-foreground">
                  بناءً على قراراتك في {simAnalysis.totalResponses} موقف مهني — أبرز سماتك:
                </p>
                <div className="space-y-[15px]">
                  {simAnalysis.traitScores.map((t, i) => {
                    const pct = (t.score / maxTraitScore) * 100;
                    const isTop = topTraits.some((tt) => tt.key === t.key);
                    return (
                      <div key={t.key}>
                        <div className="mb-[7px] flex flex-wrap justify-between gap-1">
                          <b className="text-[0.96rem] font-bold">{t.label}</b>
                          {isTop && (
                            <small className="text-[0.85rem] text-muted-foreground">
                              {TRAIT_FRIENDLY[t.key] || "سمة بارزة في شخصيتك المهنية"}
                            </small>
                          )}
                        </div>
                        <div className="h-[9px] overflow-hidden rounded-md bg-muted">
                          <motion.i
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 + i * 0.05 }}
                            className={`block h-full rounded-md ${isTop ? "bg-accent" : "bg-link/60"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ReportSection>
            )}

            {/* ===== CAREER & MAJOR RECOMMENDATIONS ===== */}
            {hollandResult?.codeInfo && (
              <ReportSection icon={Briefcase} title="مساراتك المقترحة">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <PathList title="مسارات مهنية مقترحة" items={(hollandResult.codeInfo.career_paths as string[]) ?? []} />
                  <PathList title="تخصصات موصى بها" items={(hollandResult.codeInfo.recommended_majors as string[]) ?? []} />
                </div>
              </ReportSection>
            )}

            {/* ===== TOP RANKED MAJORS ===== */}
            <ReportSection icon={GraduationCap} title="ترتيب اختياراتك النهائية">
              {shortlist && shortlist.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {shortlist.map((major, i) => (
                    <div
                      key={major.id}
                      className={`flex items-center gap-3.5 rounded-[13px] border px-4 py-3.5 ${
                        i === 0 ? "border-accent/50 bg-accent/5" : "border-border"
                      }`}
                    >
                      <span className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] font-black ${i === 0 ? "btn-gradient" : "bg-muted text-muted-foreground"}`}>
                        {toArabicDigits(i + 1)}
                      </span>
                      <div className="flex-1">
                        <b className="font-bold">{major.name_ar}</b>
                        <small className="mt-px block text-[0.8rem] text-muted-foreground">
                          تم اختياره بناءً على ترتيبك الشخصي وتوافقه مع نمطك المهني
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-[14px] border border-border p-6 text-center text-muted-foreground">
                  ستظهر اختياراتك هنا بعد إكمال مرحلة الترتيب.
                </p>
              )}
            </ReportSection>

            {/* ===== EXPLORE INSIGHTS ===== */}
            {exploreData && exploreData.length > 0 && (
              <ReportSection icon={BarChart3} title="كيف كان إحساسك مع واقع التخصص سنة بسنة؟">
                <div className="rounded-[14px] border border-border px-[18px] py-2">
                  {["year1", "year2", "year3", "year4", "post_grad"].map((stage) => {
                    const response = exploreData.find(r => r.stage_key === stage);
                    if (!response) return null;
                    return (
                      <div key={stage} className="flex items-center justify-between border-b border-border/60 py-[9px] font-semibold last:border-b-0">
                        <span className="text-sm">{STAGE_LABELS[stage]}</span>
                        <span className={`text-sm font-bold ${
                          response.comfort_level === "very_comfortable" ? "text-success" :
                          response.comfort_level === "ok" ? "text-accent" :
                          response.comfort_level === "hesitant" ? "text-[hsl(var(--gradient-end))]" :
                          "text-destructive"
                        }`}>
                          {COMFORT_LABELS[response.comfort_level] || response.comfort_level}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const mostComfortable = exploreData.reduce((best, curr) => {
                    const order = ["very_comfortable", "ok", "hesitant", "not_comfortable"];
                    return order.indexOf(curr.comfort_level) < order.indexOf(best.comfort_level) ? curr : best;
                  }, exploreData[0]);
                  return (
                    <p className="mt-2 text-sm text-muted-foreground">
                      أكثر مرحلة شعرت فيها بالراحة: <strong className="text-foreground">{STAGE_LABELS[mostComfortable.stage_key]}</strong>
                    </p>
                  );
                })()}
              </ReportSection>
            )}

            {/* ===== EXCLUDED MAJORS ===== */}
            {excludedMajors && excludedMajors.length > 0 && (
              <ReportSection icon={AlertCircle} title="تخصصات أقل توافقًا معك حاليًا">
                <div className="rounded-[14px] border border-border px-[18px]">
                  {excludedMajors.map((major, i) => (
                    <div key={i} className="border-b border-border/60 py-3.5 last:border-b-0">
                      <b className="text-sm font-bold">{major.name}</b>
                      <p className="mt-1 text-sm text-muted-foreground">{major.shortReason}</p>
                    </div>
                  ))}
                </div>
              </ReportSection>
            )}

            {/* ===== DOUBT CHECKPOINT ===== */}
            {doubtText && (
              <section className="relative mt-7 overflow-hidden rounded-2xl p-[22px] text-center text-hero-foreground [background:hsl(var(--hero-to))]">
                <div aria-hidden className="absolute inset-0 opacity-50 [background:radial-gradient(60%_80%_at_80%_20%,hsl(var(--accent)/0.2),transparent_60%)]" />
                <div className="relative mb-2 text-[0.82rem] font-bold text-accent">لحظة الصدق · إحساسك بعد ما شوفت نتائجك</div>
                <div className="relative text-[1.4rem] font-black">«{doubtText}»</div>
              </section>
            )}

            <p className="mt-[18px] text-center text-[0.8rem] text-muted-foreground">
              مبني على نموذج هولاند العلمي لقياس الميول · أثر البداية
            </p>
          </div>
        </article>

        {/* ===== CONVERSION CTAs ===== */}
        <div className="athar-foot print:hidden">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className={btnOutline} onClick={() => navigate("/dashboard/shortlist")}>
              استكشف التخصصات مرة أخرى
            </Button>
            <Button variant="outline" className={btnOutline} onClick={() => navigate("/dashboard/certificate")}>
              <FileText className="h-4 w-4" /> إصدار الشهادة
            </Button>
          </div>
          <Button className={btnPrimary} onClick={() => navigate("/dashboard/consultation")}>
            <MessageSquare className="h-5 w-5" /> احجز استشارة الآن
          </Button>
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

const heroBtn =
  "gap-2 rounded-[10px] border-hero-foreground/20 bg-hero-foreground/5 font-bold text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground";

function ReportSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-4 flex items-center gap-[11px] after:h-px after:flex-1 after:bg-border/60 after:content-['']">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-muted text-foreground">
          <Icon className="h-[17px] w-[17px]" />
        </span>
        <h2 className="m-0 text-[1.15rem] font-extrabold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative ps-[18px] text-[0.93rem] font-medium leading-normal before:absolute before:top-2 before:h-[7px] before:w-[7px] before:rounded-full before:bg-accent before:content-[''] before:[inset-inline-start:0] [&_strong]:font-bold [&_strong]:text-foreground">
      {children}
    </li>
  );
}

function StripCell({ value, label, tone }: { value: React.ReactNode; label: string; tone?: "success" | "accent" }) {
  return (
    <div className="border-border px-2.5 py-4 text-center [&:not(:first-child)]:border-s">
      <b
        className={`block text-xl font-black leading-none ${
          tone === "success" ? "text-success" : tone === "accent" ? "text-[hsl(var(--gradient-end))]" : "text-foreground"
        }`}
      >
        {value}
      </b>
      <span className="mt-[5px] block text-[0.72rem] leading-snug text-muted-foreground">{label}</span>
    </div>
  );
}

function ImpactBar({ label, value, tone, className }: { label: string; value: number; tone: "before" | "after"; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-[7px] flex justify-between text-sm font-bold text-muted-foreground">
        <span>{label}</span>
        <span>{toArabicDigits(value)}٪</span>
      </div>
      <div className="h-[11px] overflow-hidden rounded-[7px] border border-success/20 bg-card">
        <i className={`block h-full rounded-[7px] ${tone === "after" ? "bg-success" : "bg-success/25"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PathList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[14px] border border-border bg-muted/40 p-[18px]">
      <div className="mb-[11px] text-[0.92rem] font-extrabold">{title}</div>
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="relative ps-4 text-[0.92rem] font-medium before:absolute before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent before:content-[''] before:[inset-inline-start:0]">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
