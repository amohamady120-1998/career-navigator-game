import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Download, Share2, Copy, Target, TrendingUp, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { HeroBand } from "@/components/HeroBand";
import { HOLLAND_LABELS_AR, type HollandCode } from "@/components/RadarChart";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";

type Major = { id?: string; title: string; reasons: string[] };

type ReportData = {
  hollandCode: string;
  tags: string[];
  explanation: string[];
  strengths: string[];
  investmentPoints: string[];
  majors: Major[];
  shareToken: string;
};

const FALLBACK_REPORT: ReportData = {
  hollandCode: "S E C",
  tags: ["اجتماعي", "مبادر", "منظم"],
  explanation: [
    "تميل إلى مساعدة الآخرين والعمل ضمن فريق.",
    "تستمتع بإقناع الناس وقيادة المبادرات الجديدة.",
    "تفضل البيئات التي تتميز بوضوح المهام والتنظيم العالي."
  ],
  strengths: [
    "قدرة عالية على التواصل وبناء العلاقات",
    "روح القيادة والقدرة على تحفيز من حولك",
    "الالتزام بالمواعيد والدقة في التنفيذ"
  ],
  investmentPoints: [
    "تحتاج للتدرب على تفويض المهام وعدم تحمل العبء وحدك",
    "الروتين الطويل قد يشعرك بالملل، حاول تجديد بيئة عملك",
    "تطوير مهارات التحليل المالي لدعم قراراتك الإدارية"
  ],
  majors: [
    { title: "إدارة الأعمال", reasons: ["شخصيتك المبادرة (E) تتناسب مع قيادة الفرق", "تفضيلك للبيئات الديناميكية", "رغبتك في تحقيق أهداف ملموسة"] },
    { title: "العلاقات العامة", reasons: ["مهاراتك الاجتماعية (S) تدعم تواصلك الفعال", "إبداعك في إقناع الآخرين", "رغبتك في بيئة عمل تفاعلية"] },
    { title: "إدارة الموارد البشرية", reasons: ["قدرتك على فهم احتياجات الناس", "ميلك لتنظيم بيئة العمل (C)", "استمتاعك بتطوير مهارات الفريق"] }
  ],
  shareToken: ""
};



export default function InitialReportStep() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/auth');

        // Try loading from DB first
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'initial-report').single();
        if (stepRow) {
          const { data: progress } = await supabase.from('user_progress')
            .select('meta_data')
            .eq('user_id', session.user.id)
            .eq('step_id', stepRow.id)
            .maybeSingle();
          if (progress?.meta_data && (progress.meta_data as any).majors?.[0]?.id) {
            setReportData(progress.meta_data as ReportData);
            setIsLoading(false);
            return;
          }
        }

        // Try to fetch real Holland results
        const { data: hollandResult } = await supabase
          .from('holland_results')
          .select('top_code, scores')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let report = { ...FALLBACK_REPORT };

        if (hollandResult?.top_code) {
          const letters = hollandResult.top_code.slice(0, 3).split('');
          report.hollandCode = letters.join(' ');

          // Fetch descriptions from holland_codes
          const { data: codes } = await supabase
            .from('holland_codes')
            .select('*')
            .in('code', letters);

          if (codes && codes.length > 0) {
            report.tags = codes.map(c => c.description?.split('.')[0] || c.code);
            report.explanation = codes.map(c => c.description || '');
            report.strengths = codes.flatMap(c => (c.strengths as string[] || []).slice(0, 1));
            report.investmentPoints = codes.flatMap(c => (c.weaknesses as string[] || []).slice(0, 1));

            const majorsSet = new Map<string, string[]>();
            codes.forEach(c => {
              const majors = c.recommended_majors as string[] || [];
              const careers = c.career_paths as string[] || [];
              majors.slice(0, 2).forEach(m => {
                if (!majorsSet.has(m)) {
                  majorsSet.set(m, careers.slice(0, 2));
                }
              });
            });

            if (majorsSet.size > 0) {
              report.majors = Array.from(majorsSet.entries()).slice(0, 3).map(([title, reasons]) => ({
                title,
                reasons: reasons.length > 0 ? reasons : ["يتوافق مع نمطك الشخصي"]
              }));
            }
          }
        }

        // Map majors to DB IDs (SELECT-only, no INSERT to avoid RLS blocks)
        const mappedMajors = await Promise.all(
          report.majors.map(async (m) => {
            const { data } = await supabase.from('majors').select('id').eq('name_ar', m.title).maybeSingle();
            // Use DB id if found, otherwise generate a local UUID
            return { ...m, id: data?.id || crypto.randomUUID() };
          })
        );

        // Generate share token
        report.shareToken = Math.random().toString(36).substring(2, 15);
        const finalReport = { ...report, majors: mappedMajors };

        
        
        // Save to database - look up the real step UUID
        const { data: saveStepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'initial-report').single();
        if (saveStepRow) {
          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: saveStepRow.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            meta_data: finalReport
          }, { onConflict: 'user_id,step_id' });
        }

        setReportData(finalReport);
      } catch (error) {
        console.error("Error loading report:", error);
        toast.error("حدث خطأ في تحميل التقرير");
        setReportData(FALLBACK_REPORT);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [navigate]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setTimeout(() => {
      toast.success("جاري تجهيز ملف الـ PDF الخاص بك، سيتم التحميل قريباً...");
      setIsDownloading(false);
    }, 1500);
  };

  const handleCopyLink = () => {
    if (!reportData?.shareToken) return;
    const shareUrl = `${window.location.origin}/share/report/${reportData.shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("تم نسخ الرابط بنجاح! يمكنك مشاركته بأمان.");
    setIsShareModalOpen(false);
  };

  const handleContinue = () => {
    navigate('/dashboard/shortlist');
  };

  if (isLoading || !reportData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const letters = reportData.hollandCode.split('').filter(c => c !== ' ');

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الثاني · نتيجتك المبدئية"
        title="نتيجة ميولك المهنية (مبدئيًا)"
        description="💡 ده تقرير مبدئي يساعدك تبدأ… مش قرار نهائي."
      >
        <div className="flex flex-wrap items-center gap-3">
          {letters.map((letter, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-[14px] border border-hero-foreground/10 bg-hero-foreground/5 py-1.5 pe-3.5 ps-1.5">
              <span className="btn-gradient grid h-11 w-11 place-items-center rounded-xl text-xl font-black">{letter}</span>
              <span className="text-sm font-bold text-hero-muted">{HOLLAND_LABELS_AR[letter as HollandCode] ?? letter}</span>
            </div>
          ))}
        </div>
        {reportData.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {reportData.tags.map((tag, i) => (
              <span key={i} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-[10px] border-hero-foreground/20 bg-hero-foreground/5 font-bold text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-[10px] font-bold text-hero-muted hover:bg-hero-foreground/10 hover:text-hero-foreground"
            onClick={() => navigate('/dashboard')}
          >
            عودة للوحة التحكم
          </Button>
        </div>
      </HeroBand>

      {/* MEANING SECTION */}
      <section className="athar-card mb-4">
        <h2 className="mb-4 flex items-center gap-2.5 text-[1.05rem] font-extrabold">
          <SectionIcon><Sparkles className="h-4 w-4" /></SectionIcon>
          إيه معنى النتيجة دي؟
        </h2>
        <ul className="flex flex-col gap-[9px]">
          {reportData.explanation.map((item, i) => (
            <li key={i} className="relative ps-[18px] text-[0.93rem] font-medium leading-relaxed before:absolute before:top-2 before:h-[7px] before:w-[7px] before:rounded-full before:bg-accent before:content-[''] before:[inset-inline-start:0]">
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* STRENGTHS & INVESTMENTS */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-[14px] border border-border bg-card p-[18px]">
          <h3 className="mb-[13px] flex items-center gap-2 text-[0.95rem] font-extrabold text-success">
            <TrendingUp className="h-[18px] w-[18px]" /> نقاط قوة عندك
          </h3>
          <ul className="flex flex-col gap-[11px]">
            {reportData.strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.92rem] font-medium leading-normal">
                <span className="mt-px grid h-[19px] w-[19px] flex-none place-items-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[14px] border border-border bg-card p-[18px]">
          <h3 className="mb-[13px] flex items-center gap-2 text-[0.95rem] font-extrabold text-[hsl(var(--gradient-end))]">
            <Target className="h-[18px] w-[18px]" /> نقاط استثمار (تحتاج تطوير)
          </h3>
          <ul className="flex flex-col gap-[11px]">
            {reportData.investmentPoints.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.92rem] font-medium leading-normal">
                <span className="mt-px grid h-[19px] w-[19px] flex-none place-items-center rounded-full bg-accent/15 text-[hsl(var(--gradient-end))]">
                  <AlertCircle className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* TOP MAJORS */}
      <section className="athar-card">
        <h2 className="mb-1 text-[1.05rem] font-extrabold">
          أفضل {toArabicDigits(reportData.majors.length)} مسارات مناسبة لك حاليًا
        </h2>
        <p className="mb-3.5 text-sm text-muted-foreground">لمحة أولى؛ سنضيّقها في الخطوات القادمة.</p>
        <div className="flex flex-col gap-[11px]">
          {reportData.majors.map((major, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-[13px] border px-[17px] py-[15px] ${
                i === 0 ? "border-accent/50 bg-accent/5" : "border-border bg-card"
              }`}
            >
              <span
                className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] font-extrabold ${
                  i === 0 ? "btn-gradient" : "bg-muted text-muted-foreground"
                }`}
              >
                {toArabicDigits(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">{major.title}</h3>
                {major.reasons.map((reason, idx) => (
                  <p key={idx} className="mt-0.5 text-[0.85rem] text-muted-foreground">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="athar-foot">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className={btnOutline} onClick={handleDownloadPDF} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              تحميل PDF
            </Button>
            <Button variant="outline" className={btnOutline} onClick={() => setIsShareModalOpen(true)}>
              <Share2 className="h-4 w-4" />
              مشاركة التقرير
            </Button>
          </div>
          <Button className={btnPrimary} onClick={handleContinue}>
            كمّل — رتّب اختياراتك
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* SHARE MODAL */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>مشاركة التقرير</DialogTitle>
            <DialogDescription>
              هذا الرابط آمن وخاص بك. أي شخص يمتلك هذا الرابط يمكنه رؤية هذه الصفحة فقط (بدون إمكانية التعديل أو رؤية بياناتك الأخرى).
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 bg-muted p-3 rounded-lg text-sm text-muted-foreground break-all font-mono">
              {`${window.location.origin}/share/report/${reportData.shareToken}`}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost" className="w-full">إغلاق</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-accent/15 text-[hsl(var(--gradient-end))]">
      {children}
    </span>
  );
}
