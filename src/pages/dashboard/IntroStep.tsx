import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Rocket,
  ChevronLeft,
  Flag,
  ClipboardList,
  Compass,
  Gauge,
  BarChart3,
  ListOrdered,
  Filter,
  Heart,
  BookOpen,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Award,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseVideo } from "@/components/CourseVideo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useJourney } from "@/hooks/use-journey";
import { JOURNEY_STEPS } from "@/lib/stepConfig";
import { HeroBand, HeroBandProgress, HeroBandSubtle } from "@/components/HeroBand";
import { JourneyMap, type JourneyNode } from "@/components/JourneyMap";

export default function IntroStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { completedSlugs } = useJourney();

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "intro")
        .single();

      if (step) {
        await supabase.from("user_progress").upsert({
          user_id: session.user.id,
          step_id: step.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,step_id" });
      }

      await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

      navigate("/dashboard/pre-impact");
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const completedCount = JOURNEY_STEPS.filter((st) => completedSlugs.includes(st.slug)).length;
  const total = JOURNEY_STEPS.length;
  const pct = Math.round((completedCount / total) * 100);
  const introDone = completedSlugs.includes("intro");

  const nodes: JourneyNode[] = JOURNEY_STEPS.map((st, i) => {
    const done = completedSlugs.includes(st.slug);
    const unlocked = i === 0 || done || completedSlugs.includes(JOURNEY_STEPS[i - 1].slug);
    return {
      id: st.slug,
      label: MAP_LABELS[st.slug] ?? st.labelAr,
      icon: MAP_ICONS[st.slug] ?? BookOpen,
      status: done ? "done" : unlocked ? "current" : "locked",
    };
  });
  const currentNode = nodes.find((n) => n.status === "current");
  const currentStep = JOURNEY_STEPS.find((st) => st.slug === currentNode?.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="athar-page"
    >
      <HeroBand
        eyebrow="خريطة رحلتك"
        title={
          introDone ? (
            <>أنت في المرحلة {toArabicDigits(completedCount + 1 > total ? total : completedCount + 1)} من {toArabicDigits(total)}</>
          ) : (
            <>
              مرحبًا بك في رحلة <HeroBandSubtle>أثر البداية</HeroBandSubtle>
            </>
          )
        }
        description={
          introDone
            ? "بصمتك المهنية بدأت تتّضح. تابع من حيث توقفت، فأنت على بُعد خطوات من قرارك."
            : "ستمرّ بمراحل مصمّمة بعناية لتكتشف ميولك المهنية وتحدّد التخصص الجامعي الأنسب لك. تُفتح كل مرحلة بعد إكمال سابقتها."
        }
      >
        <HeroBandProgress value={pct} label={`${toArabicDigits(pct)}٪`} />
        <div className="mt-5">
          {introDone && currentStep ? (
            <Button
              onClick={() => navigate(currentStep.route)}
              className="btn-gradient h-auto rounded-xl px-[26px] py-3.5 text-base shadow-premium"
            >
              تابع من حيث توقفت
              <ChevronLeft className="h-[17px] w-[17px]" />
            </Button>
          ) : !introDone ? (
            <Button
              onClick={handleStart}
              disabled={loading}
              className="btn-gradient h-auto rounded-xl px-[26px] py-3.5 text-base shadow-premium"
            >
              {loading ? "جارٍ البدء..." : "ابدأ الرحلة"}
              {!loading && <Rocket className="h-[17px] w-[17px]" />}
            </Button>
          ) : null}
        </div>
      </HeroBand>

      <div className="mb-1.5 mt-[18px] grid gap-3.5 sm:grid-cols-3">
        {[
          { v: toArabicDigits(completedCount), l: "مراحل مكتملة" },
          { v: currentNode?.label ?? "اكتملت", l: "مرحلتك الحالية", accent: true },
          { v: toArabicDigits(total - completedCount), l: "مراحل متبقّية" },
        ].map((m) => (
          <div key={m.l} className="athar-card p-4 text-center md:p-4">
            <b
              className={`block font-black leading-none ${
                m.accent ? "text-[1.15rem] text-[hsl(var(--gradient-end))]" : "text-2xl"
              }`}
            >
              {m.v}
            </b>
            <span className="mt-[7px] block text-[0.8rem] text-muted-foreground">{m.l}</span>
          </div>
        ))}
      </div>

      {!introDone && (
        <>
          <SectionTitle>قبل أن تبدأ</SectionTitle>
          <div className="athar-card mt-2.5">
            <CourseVideo
              title="مرحبًا بك في أثر… لماذا نحتار في اختيار التخصص؟"
              description="شاهد هذا المقطع التمهيدي قبل أن تبدأ رحلتك لاكتشاف ذاتك."
              videoUrl=""
            />
          </div>
        </>
      )}

      <SectionTitle>مسار الرحلة كاملًا</SectionTitle>
      <div className="athar-card relative mt-2.5 overflow-hidden px-4 pb-[22px] pt-[30px] md:px-4">
        <JourneyMap
          nodes={nodes}
          onSelect={(n) => {
            const st = JOURNEY_STEPS.find((j) => j.slug === n.id);
            if (st) navigate(st.route);
          }}
          onLockedSelect={() => toast({ title: "🔒 أكمل المراحل السابقة أولًا" })}
        />
      </div>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-0.5 mt-[26px] flex items-center gap-2.5 text-[1.05rem] font-extrabold after:h-px after:flex-1 after:bg-border after:content-['']">
      {children}
    </div>
  );
}

const toArabicDigits = (n: number) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const MAP_LABELS: Record<string, string> = {
  intro: "البداية",
  "pre-impact": "قبل أن نبدأ",
  orientation: "التهيئة",
  holland: "اختبار الميول",
  "initial-report": "نتيجتك المبدئية",
  shortlist: "ترتيب الاختيارات",
  "excluded-majors": "لماذا استبعدناها",
  "doubt-checkpoint": "لحظة صدق",
  explore: "الاستكشاف",
  simulation: "المحاكاة",
  "post-impact": "بعد رحلتك",
  report: "التقرير النهائي",
  certificate: "الشهادة",
  "next-step": "الخطوة التالية",
};

const MAP_ICONS: Record<string, LucideIcon> = {
  intro: Flag,
  "pre-impact": ClipboardList,
  orientation: Compass,
  holland: Gauge,
  "initial-report": BarChart3,
  shortlist: ListOrdered,
  "excluded-majors": Filter,
  "doubt-checkpoint": Heart,
  explore: BookOpen,
  simulation: CircleAlert,
  "post-impact": ClipboardCheck,
  report: FileText,
  certificate: Award,
  "next-step": Zap,
};
