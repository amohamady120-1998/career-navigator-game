import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, GraduationCap, Brain, Sparkles, CheckCircle2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["shared-report", token],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const { data, error } = await supabase
        .from("final_reports")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Report not found");
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">جاري تحميل التقرير...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">التقرير غير متاح</h2>
          <p className="text-muted-foreground">هذا الرابط غير صالح أو أن التقرير لم يعد متاحًا للمشاركة.</p>
        </Card>
      </div>
    );
  }

  const payload = report.payload as Record<string, any> || {};

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-1">التقرير النهائي — أثر البداية</h1>
          <p className="text-sm text-muted-foreground">تقرير مشارك بواسطة الطالب</p>
        </div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> ملخص الرحلة
            </h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              {payload.holland_code && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>النمط المهني: <strong className="text-foreground">{payload.holland_code}</strong></span>
                </li>
              )}
              {payload.shortlist_count > 0 && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>عدد التخصصات المختارة: {payload.shortlist_count}</span>
                </li>
              )}
              {payload.explore_stages > 0 && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>مراحل الاستكشاف المكتملة: {payload.explore_stages}</span>
                </li>
              )}
              {payload.sim_responses > 0 && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span>مواقف المحاكاة: {payload.sim_responses}</span>
                </li>
              )}
              {!payload.holland_code && !payload.shortlist_count && !payload.explore_stages && !payload.sim_responses && (
                <li>لا توجد بيانات كافية لعرض ملخص الرحلة.</li>
              )}
            </ul>
          </Card>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t border-border">
          <p>تم إنشاء هذا التقرير بواسطة منصة أثر البداية</p>
          <p className="mt-1">هذا تقرير للقراءة فقط — لا يمكن التعديل عليه</p>
        </div>
      </div>
    </div>
  );
}
