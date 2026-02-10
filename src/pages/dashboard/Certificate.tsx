import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Award } from "lucide-react";
import { motion } from "framer-motion";
import atharLogoLight from "@/assets/athar-logo-light.png";

export default function Certificate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [userId, setUserId] = useState("");
  const [completionDate, setCompletionDate] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      setUserId(session.user.id.slice(0, 8).toUpperCase());

      const { data: steps } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "report")
        .maybeSingle();

      if (!steps) { setLoading(false); return; }

      const { data: progress } = await supabase
        .from("user_progress")
        .select("completed_at")
        .eq("user_id", session.user.id)
        .eq("step_id", steps.id)
        .eq("status", "completed")
        .maybeSingle();

      if (progress) {
        setEligible(true);
        setCompletionDate(
          progress.completed_at
            ? new Date(progress.completed_at).toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })
            : new Date().toLocaleDateString("ar-SA", {
                year: "numeric", month: "long", day: "numeric",
              })
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setStudentName(profile?.full_name ?? "طالب");
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 space-y-4"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Award className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-extrabold">لم تكتمل الرحلة بعد</h2>
        <p className="text-muted-foreground">أكمل جميع مراحل الرحلة للحصول على الشهادة</p>
        <Button onClick={() => navigate("/dashboard")} className="btn-gradient rounded-xl px-8">العودة للرحلة</Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()} className="gap-2 rounded-xl">
          <Printer className="w-4 h-4" />
          طباعة / تحميل PDF
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div
          id="certificate"
          className="max-w-2xl mx-auto bg-card border-4 border-accent rounded-2xl p-12 text-center shadow-premium-lg print:shadow-none print:border-2"
        >
          <img src={atharLogoLight} alt="أثر" className="h-16 mx-auto mb-6" />

          <div className="pb-4 mb-6">
            <div className="section-divider mb-4" />
            <h1 className="text-3xl font-extrabold text-primary">شهادة إتمام</h1>
            <p className="text-muted-foreground mt-1">رحلة أثر للتوجيه المهني</p>
          </div>

          <p className="text-lg text-muted-foreground mb-2">يُشهد بأن</p>
          <h2 className="text-4xl font-extrabold text-gradient mb-6">{studentName}</h2>

          <p className="text-lg text-foreground leading-relaxed max-w-md mx-auto mb-8">
            قد أتمّ بنجاح جميع مراحل رحلة أثر البداية للتوجيه المهني،
            شاملةً الاختبارات والمحاكاة والتقرير النهائي.
          </p>

          <div className="flex justify-between items-end text-sm text-muted-foreground border-t border-border/60 pt-4">
            <div>
              <p className="font-semibold">تاريخ الإتمام</p>
              <p>{completionDate}</p>
            </div>
            <div>
              <p className="font-semibold">رمز التحقق</p>
              <p className="font-mono">{userId}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
