import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface Check {
  label: string;
  value: string | number;
  status: "ok" | "warn" | "error";
  message?: string;
}

export default function AdminHealthCheck() {
  const { data: checks, isLoading } = useQuery({
    queryKey: ["admin-health-check"],
    queryFn: async () => {
      const results: Check[] = [];
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000).toISOString();

      // 1. Majors count
      const { count: majorsCount } = await supabase.from("majors").select("*", { count: "exact", head: true }).eq("is_active", true);
      results.push({
        label: "عدد التخصصات النشطة",
        value: majorsCount || 0,
        status: (majorsCount || 0) > 0 ? "ok" : "error",
        message: (majorsCount || 0) === 0 ? "لا توجد تخصصات! أضف تخصصات من مدير الاستكشاف." : undefined,
      });

      // 2. Holland major map coverage
      const { data: hollandMap } = await supabase.from("holland_major_map").select("holland_code");
      const hollandCodes = ["R", "I", "A", "S", "E", "C"];
      const codeCounts = hollandCodes.map(code => ({
        code,
        count: (hollandMap || []).filter(m => m.holland_code === code).length,
      }));
      const missingCodes = codeCounts.filter(c => c.count < 3);
      results.push({
        label: "تغطية خريطة هولاند",
        value: `${codeCounts.filter(c => c.count >= 3).length}/6 أكواد مكتملة`,
        status: missingCodes.length === 0 ? "ok" : missingCodes.length <= 2 ? "warn" : "error",
        message: missingCodes.length > 0 ? `أكواد ناقصة (أقل من 3 تخصصات): ${missingCodes.map(c => c.code).join(", ")}` : undefined,
      });

      // 3. Explore content coverage
      const { data: sections } = await supabase.from("major_explore_sections").select("major_id, stage_key");
      const majorSections = new Map<string, Set<string>>();
      (sections || []).forEach(s => {
        if (s.major_id) {
          if (!majorSections.has(s.major_id)) majorSections.set(s.major_id, new Set());
          majorSections.get(s.major_id)!.add(s.stage_key);
        }
      });
      const fullCoverage = [...majorSections.values()].filter(stages => stages.size >= 5).length;
      results.push({
        label: "تغطية محتوى الاستكشاف",
        value: `${fullCoverage}/${majorSections.size} تخصصات مكتملة (5 مراحل)`,
        status: majorSections.size > 0 && fullCoverage === majorSections.size ? "ok" : fullCoverage > 0 ? "warn" : "error",
        message: fullCoverage < majorSections.size ? `${majorSections.size - fullCoverage} تخصصات تحتاج إكمال المراحل` : undefined,
      });

      // 4. Active school orders
      const { count: activeOrders } = await supabase.from("school_orders").select("*", { count: "exact", head: true }).eq("status", "active");
      results.push({
        label: "طلبات المدارس النشطة",
        value: activeOrders || 0,
        status: "ok",
      });

      // 5. Errors last 24h
      const { count: errorCount } = await supabase.from("app_error_logs").select("*", { count: "exact", head: true }).gte("created_at", yesterday);
      results.push({
        label: "أخطاء آخر 24 ساعة",
        value: errorCount || 0,
        status: (errorCount || 0) === 0 ? "ok" : (errorCount || 0) <= 10 ? "warn" : "error",
        message: (errorCount || 0) > 10 ? "عدد كبير من الأخطاء — تفقد سجل الأخطاء" : undefined,
      });

      // 6. Consultations last 24h
      const { count: consultCount } = await supabase.from("consultation_requests").select("*", { count: "exact", head: true }).gte("created_at", yesterday);
      results.push({
        label: "استشارات آخر 24 ساعة",
        value: consultCount || 0,
        status: "ok",
      });

      return results;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-success" />;
    if (status === "warn") return <AlertTriangle className="w-5 h-5 text-warning" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Activity className="w-6 h-6" /> فحص صحة النظام
      </h1>

      <div className="space-y-3">
        {checks?.map((check, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <StatusIcon status={check.status} />
              <div className="flex-1">
                <p className="font-medium text-sm">{check.label}</p>
                {check.message && (
                  <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
                )}
              </div>
              <Badge variant={check.status === "ok" ? "default" : check.status === "warn" ? "secondary" : "destructive"}>
                {check.value}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
