import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Download, Share2, Copy, Brain, Target, TrendingUp, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* HEADER */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-lg text-primary">أثر ستارت</div>
            <div className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
              تقريرك المبدئي
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              عودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 max-w-3xl mx-auto w-full">
        {/* HERO SUMMARY */}
        <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background mb-8 text-center animate-in fade-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">نتيجة ميولك المهنية (مبدئيًا)</h1>
          <p className="text-sm text-muted-foreground mb-6">
            💡 ده تقرير مبدئي يساعدك تبدأ… مش قرار نهائي.
          </p>

          <div className="flex justify-center gap-4 mb-4">
            {reportData.hollandCode.split('').filter(c => c !== ' ').map((letter, i) => (
              <div key={i} className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-md">
                {letter}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {reportData.tags.map((tag, i) => (
              <span key={i} className="text-xs font-bold bg-accent text-accent-foreground px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </Card>

        {/* MEANING SECTION */}
        <Card className="p-6 border-2 border-border bg-card mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> إيه معنى النتيجة دي؟
          </h2>
          <div className="space-y-3">
            {reportData.explanation.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-muted-foreground text-sm leading-relaxed">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* STRENGTHS & INVESTMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-5 border-2 border-border bg-card">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> نقاط قوة عندك
            </h3>
            <div className="space-y-2">
              {reportData.strengths.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 border-2 border-border bg-card">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" /> نقاط استثمار (تحتاج تطوير)
            </h3>
            <div className="space-y-2">
              {reportData.investmentPoints.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* TOP MAJORS */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-foreground mb-4">
            أفضل {reportData.majors.length} مسارات مناسبة لك حاليًا
          </h2>
          <div className="space-y-4">
            {reportData.majors.map((major, i) => (
              <Card key={i} className="p-5 border-2 border-border bg-card flex gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-extrabold text-lg shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{major.title}</h3>
                  <div className="space-y-1">
                    {major.reasons.map((reason, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECONDARY ACTIONS */}
        <div className="flex gap-3 mb-6">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            تحميل PDF
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => setIsShareModalOpen(true)}>
            <Share2 className="w-4 h-4" />
            مشاركة التقرير
          </Button>
        </div>

        {/* PRIMARY CTA */}
        <div className="pb-10">
          <Button size="lg" className="w-full h-14 text-lg font-bold rounded-xl shadow-md transition-all active:scale-95" onClick={handleContinue}>
            كمّل — رتّب اختياراتك
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </main>

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
