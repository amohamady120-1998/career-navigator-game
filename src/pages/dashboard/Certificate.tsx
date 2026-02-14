import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Award, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import atharLogoLight from "@/assets/athar-logo-light.png";

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

      const fullName = profile?.full_name || "طالب أثر";
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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Gate: report not completed
  if (!reportCompleted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Award className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-extrabold">لا يمكن إصدار الشهادة بعد</h2>
        <p className="text-muted-foreground">يجب إكمال التقرير النهائي أولاً قبل إصدار الشهادة</p>
        <Button onClick={() => navigate("/dashboard/final-report")} className="btn-gradient rounded-xl px-8 gap-2">
          <ArrowLeft className="w-4 h-4" /> اذهب للتقرير النهائي
        </Button>
      </motion.div>
    );
  }

  // No certificate yet — show issue button
  if (!certificate) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
          <Award className="w-10 h-10 text-accent" />
        </div>
        <h2 className="text-xl font-extrabold">شهادتك جاهزة للإصدار!</h2>
        <p className="text-muted-foreground">اضغط على الزر أدناه لإصدار شهادة إتمام رحلة أثر البداية</p>
        <Button onClick={handleIssueCertificate} disabled={issuing} className="btn-gradient rounded-xl px-8 h-12 text-base gap-2">
          {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-5 h-5" />}
          إصدار الشهادة الآن
        </Button>
      </motion.div>
    );
  }

  const completionDate = new Date(certificate.issued_at).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });

  const verifyUrl = `${window.location.origin}/verify/${certificate.certificate_code}`;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()} className="gap-2 rounded-xl">
          <Printer className="w-4 h-4" /> طباعة / تحميل PDF
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div id="certificate" className="max-w-2xl mx-auto bg-card border-4 border-accent rounded-2xl p-12 text-center shadow-premium-lg print:shadow-none print:border-2">
          <img src={atharLogoLight} alt="أثر" className="h-16 mx-auto mb-6" />

          <div className="pb-4 mb-6">
            <div className="section-divider mb-4" />
            <h1 className="text-3xl font-extrabold text-primary">شهادة إتمام</h1>
            <p className="text-muted-foreground mt-1">رحلة أثر للتوجيه المهني</p>
          </div>

          <p className="text-lg text-muted-foreground mb-2">يُشهد بأن</p>
          <h2 className="text-4xl font-extrabold text-gradient mb-6">{certificate.full_name}</h2>

          <p className="text-lg text-foreground leading-relaxed max-w-md mx-auto mb-8">
            قد أتمّ بنجاح جميع مراحل رحلة أثر البداية للتوجيه المهني،
            شاملةً الاختبارات والمحاكاة والتقرير النهائي.
          </p>

          <div className="flex justify-between items-end text-sm text-muted-foreground border-t border-border/60 pt-4">
            <div>
              <p className="font-semibold">تاريخ الإصدار</p>
              <p>{completionDate}</p>
            </div>
            <div>
              <p className="font-semibold">رمز التحقق</p>
              <p className="font-mono text-primary font-bold">{certificate.certificate_code}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            للتحقق: {verifyUrl}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-3 print:hidden mt-6">
        <Button type="button" onClick={() => navigate("/dashboard/next-step")} className="w-full max-w-md h-12 text-base font-bold rounded-xl btn-gradient gap-2">
          الخطوة التالية
        </Button>
        <Button type="button" onClick={() => navigate("/dashboard/consultation")} variant="outline" className="w-full max-w-md rounded-xl">
          احجز استشارة
        </Button>
      </div>
    </div>
  );
}
