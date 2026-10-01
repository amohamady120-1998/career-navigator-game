import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Award, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { HeroBand } from "@/components/HeroBand";
import { RadarChart } from "@/components/RadarChart";
import { btnOutline, btnPrimary } from "@/lib/athar";

/** Public verification lives on the production domain, not the hosting origin. */
const VERIFY_HOST = "athar.uniex.tech";

/** Fallback name used by older certificates when the profile had no name. */
const PLACEHOLDER_NAME = "طالب أثر";

type CertificateDetails = {
  fullName: string | null;
  hollandCode: string | null;
  hollandScores: Record<string, number> | null;
  topMajor: string | null;
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Certificate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [reportCompleted, setReportCompleted] = useState(false);
  const [certificate, setCertificate] = useState<{
    certificate_code: string;
    full_name: string;
    issued_at: string;
  } | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [details, setDetails] = useState<CertificateDetails>({
    fullName: null,
    hollandCode: null,
    hollandScores: null,
    topMajor: null,
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Check if final report / report step completed
      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "report")
        .maybeSingle();

      if (step) {
        const { data: progress } = await supabase
          .from("user_progress")
          .select("status")
          .eq("user_id", session.user.id)
          .eq("step_id", step.id)
          .eq("status", "completed")
          .maybeSingle();
        if (progress) setReportCompleted(true);
      }

      // Also check final_reports existence as fallback
      if (!reportCompleted) {
        const { data: fr } = await supabase
          .from("final_reports")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (fr) setReportCompleted(true);
      }

      // Fetch existing certificate
      const { data: cert } = await supabase
        .from("certificates")
        .select("certificate_code, full_name, issued_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Student details shown on the certificate
      const [{ data: profile }, { data: holland }, { data: reportStep }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", session.user.id).maybeSingle(),
        supabase
          .from("holland_results")
          .select("top_code, scores")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("journey_steps").select("id").eq("slug", "initial-report").maybeSingle(),
      ]);

      // Closest destination = first (highest-fit) major of the initial report
      let topMajor: string | null = null;
      if (reportStep) {
        const { data: reportProgress } = await supabase
          .from("user_progress")
          .select("meta_data")
          .eq("user_id", session.user.id)
          .eq("step_id", reportStep.id)
          .maybeSingle();
        const majors = (reportProgress?.meta_data as { majors?: { title?: string }[] } | null)?.majors;
        topMajor = majors?.[0]?.title ?? null;
      }
      // Fallback: the student's own first choice
      if (!topMajor) {
        const { data: shortlist } = await supabase
          .from("student_shortlist")
          .select("ranking_ids, major_ids")
          .eq("user_id", session.user.id)
          .maybeSingle();
        const firstId = (shortlist?.ranking_ids as string[] | null)?.[0] ?? (shortlist?.major_ids as string[] | null)?.[0];
        if (firstId) {
          const { data: major } = await supabase.from("majors").select("name_ar").eq("id", firstId).maybeSingle();
          topMajor = major?.name_ar ?? null;
        }
      }

      const realName = profile?.full_name?.trim() || null;
      setDetails({
        fullName: realName,
        hollandCode: holland?.top_code ?? null,
        hollandScores: (holland?.scores as Record<string, number> | null) ?? null,
        topMajor,
      });

      // Older certificates may have been issued with the placeholder name; store the real one
      // so the public verification page shows it too.
      if (cert && realName && cert.full_name === PLACEHOLDER_NAME) {
        const { error: renameError } = await supabase
          .from("certificates")
          .update({ full_name: realName })
          .eq("user_id", session.user.id);
        if (!renameError) cert.full_name = realName;
      }

      if (cert) setCertificate(cert);
      setLoading(false);
    })();
  }, [navigate]);

  const handleIssueCertificate = async () => {
    setIssuing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get student name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const fullName =
        profile?.full_name?.trim() ||
        (session.user.user_metadata?.full_name as string | undefined)?.trim() ||
        PLACEHOLDER_NAME;
      const code = generateCode();

      const { data, error } = await supabase.from("certificates").upsert({
        user_id: session.user.id,
        certificate_code: code,
        full_name: fullName,
        whatsapp: profile?.phone || null,
        issued_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).select("certificate_code, full_name, issued_at").single();

      if (error) throw error;
      setCertificate(data);

      // Mark certificate step completed
      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "certificate")
        .maybeSingle();

      if (step) {
        await supabase.from("user_progress").upsert({
          user_id: session.user.id,
          step_id: step.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,step_id" });
        queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

      }

      toast.success("تم إصدار الشهادة بنجاح!");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء إصدار الشهادة");
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Gate: report not completed
  if (!reportCompleted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="athar-page">
        <HeroBand
          eyebrow="الفصل الرابع · الشهادة"
          title="لا يمكن إصدار الشهادة بعد"
          description="يجب إكمال التقرير النهائي أولاً قبل إصدار الشهادة"
        >
          <Button onClick={() => navigate("/dashboard/final-report")} className={btnPrimary}>
            اذهب للتقرير النهائي <ArrowLeft className="h-4 w-4" />
          </Button>
        </HeroBand>
      </motion.div>
    );
  }

  // No certificate yet — show issue button
  if (!certificate) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="athar-page">
        <HeroBand
          eyebrow="الفصل الرابع · الشهادة"
          title="شهادتك جاهزة للإصدار!"
          description="اضغط على الزر أدناه لإصدار شهادة إتمام رحلة أثر البداية"
        >
          <Button onClick={handleIssueCertificate} disabled={issuing} className={btnPrimary}>
            {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-5 w-5" />}
            إصدار الشهادة الآن
          </Button>
        </HeroBand>
      </motion.div>
    );
  }

  const completionDate = new Date(certificate.issued_at).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });

  const verifyUrl = `https://${VERIFY_HOST}/verify/${certificate.certificate_code}`;
  const displayName = details.fullName || certificate.full_name;

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand eyebrow="الفصل الرابع · الشهادة" title="مبروك، أتممت رحلتك" className="pb-[18px] print:hidden" />

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div
          id="certificate"
          className="relative mx-auto flex max-w-[560px] items-center justify-center overflow-hidden rounded-xl p-[clamp(30px,5vw,46px)] text-ink shadow-premium-lg [background:radial-gradient(130%_90%_at_50%_-10%,white,hsl(var(--cream))_60%)] print:shadow-none"
        >
          {/* Gold double frame */}
          <span aria-hidden className="pointer-events-none absolute inset-4 rounded-md border-2 border-gold-light">
            <span className="absolute inset-1.5 rounded-[3px] border border-gold-pale" />
          </span>

          {/* Faint Holland radar watermark (prototype `.fc-radar`) */}
          {details.hollandScores && (
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center opacity-[0.06]">
              <RadarChart variant="watermark" values={details.hollandScores} className="w-[64%] max-w-none" ariaLabel="" />
            </div>
          )}

          <div className="relative z-[2] flex w-full max-w-[440px] flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-[9px] font-semibold">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-ink text-gold-light">
                <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]" aria-hidden>
                  <path d="M3.5 15C6 9 9 9 11 13s4 5 6.5 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="8.6" cy="6.6" r="1.35" fill="currentColor" />
                  <circle cx="12.2" cy="6.6" r="1.35" fill="currentColor" />
                </svg>
              </span>
              أثر البداية
            </div>
            <div className="mb-2 bg-gradient-to-l from-gold via-gold-light to-gold bg-clip-text text-[0.7rem] font-semibold tracking-[0.38em] text-transparent" dir="ltr">
              CERTIFICATE OF COMPLETION
            </div>
            <h1 className="mb-3.5 text-[clamp(1.5rem,4vw,2rem)] font-bold">شهادة إتمام</h1>
            <p className="mb-2 text-sm text-muted-foreground">رحلة أثر للتوجيه المهني · يُشهد بأن</p>
            <h2 className="m-0 text-[clamp(2rem,5vw,2.7rem)] font-extrabold">{displayName}</h2>
            <div aria-hidden className="relative mb-[18px] mt-3.5 h-0.5 w-[min(240px,70%)] [background:linear-gradient(90deg,transparent,hsl(var(--gold-light))_25%,hsl(var(--gold-pale))_50%,hsl(var(--gold-light))_75%,transparent)]">
              <span className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-gold-light shadow-[0_0_0_3px_hsl(var(--cream))]" />
            </div>
            <p className="m-0 max-w-[46ch] text-[0.94rem] font-light leading-[1.9]">
              قد أتمّ بنجاح جميع مراحل رحلة أثر البداية للتوجيه المهني،
              شاملةً الاختبارات والمحاكاة والتقرير النهائي.
            </p>

            <div className="mt-[22px] inline-flex max-w-full overflow-hidden rounded-[14px] border border-gold/30 bg-gold-light/5">
              <MetaCell value={<span dir="ltr">{details.hollandCode ?? "—"}</span>} label="النمط المهني" />
              <MetaCell value={details.topMajor ?? "—"} label="الوجهة الأقرب" />
              <MetaCell value={completionDate} label="تاريخ الإصدار" />
            </div>

            <div className="mt-[26px] flex w-full flex-col items-center justify-between gap-[22px] sm:flex-row sm:items-end">
              <div className="text-center">
                <span className="mb-[5px] block min-w-[130px] border-b border-ink pb-1.5 text-[1.05rem] font-semibold">أثر البداية</span>
                <small className="text-[0.72rem] text-muted-foreground">الجهة المانحة</small>
              </div>
              <div className="relative grid h-[74px] w-[74px] flex-none place-items-center" aria-hidden>
                <span className="absolute inset-0 rounded-full border-[1.5px] border-gold-light">
                  <span className="absolute inset-[5px] rounded-full border border-dashed border-gold/50" />
                </span>
                <span className="grid h-[58%] w-[58%] place-items-center rounded-full [background:conic-gradient(from_210deg,hsl(var(--gold-light)),hsl(var(--gold)),hsl(var(--gold-pale)),hsl(var(--gold)),hsl(var(--gold-light)))]">
                  <Award className="h-1/2 w-1/2" />
                </span>
              </div>
            </div>

            <div className="mt-[22px] flex w-full items-center justify-center gap-3 border-t border-gold/30 pt-[18px]">
              <QRCodeSVG
                value={verifyUrl}
                size={48}
                level="M"
                bgColor="transparent"
                fgColor="currentColor"
                className="flex-none rounded text-ink"
                aria-label="رمز QR للتحقّق من الشهادة"
              />
              <div className="min-w-0 text-start">
                <b className="block text-[0.8rem] font-semibold">للتحقّق من صحة الشهادة</b>
                <span className="block break-all text-[0.7rem] text-muted-foreground" dir="ltr">
                  {certificate.certificate_code} · {VERIFY_HOST}/verify
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="athar-foot print:hidden">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()} className={btnOutline}>
            <Printer className="h-4 w-4" /> طباعة / تحميل PDF
          </Button>
          <Button type="button" onClick={() => navigate("/dashboard/consultation")} variant="outline" className={btnOutline}>
            احجز استشارة
          </Button>
        </div>
        <Button type="button" onClick={() => navigate("/dashboard/next-step")} className={btnPrimary}>
          الخطوة التالية <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MetaCell({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="min-w-0 px-[clamp(12px,3vw,24px)] py-[11px] [&:not(:first-child)]:border-s [&:not(:first-child)]:border-gold/20">
      <div className="text-[0.95rem] font-bold">{value}</div>
      <div className="mt-[3px] text-[0.66rem] text-muted-foreground">{label}</div>
    </div>
  );
}
