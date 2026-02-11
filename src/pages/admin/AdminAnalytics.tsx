import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BarChart3, TrendingDown } from "lucide-react";
import { Label } from "@/components/ui/label";

const FUNNEL_STEPS = [
  { key: "intro", label: "المقدمة" },
  { key: "pre_impact", label: "قياس ما قبل" },
  { key: "orientation", label: "التوجيه" },
  { key: "holland", label: "اختبار هولاند" },
  { key: "initial_report", label: "التقرير الأولي" },
  { key: "shortlist", label: "القائمة المختصرة" },
  { key: "excluded_majors", label: "التخصصات المستبعدة" },
  { key: "doubt_checkpoint", label: "نقطة التردد" },
  { key: "explore", label: "استكشاف التخصصات" },
  { key: "simulation", label: "المحاكاة" },
  { key: "post_impact", label: "قياس ما بعد" },
  { key: "report", label: "التقرير النهائي" },
  { key: "certificate", label: "الشهادة" },
];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const dateFrom = useMemo(() => {
    if (dateRange === "7") return new Date(Date.now() - 7 * 86400000).toISOString();
    if (dateRange === "30") return new Date(Date.now() - 30 * 86400000).toISOString();
    return null;
  }, [dateRange]);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-analytics-events", dateRange],
    queryFn: async () => {
      let query = supabase.from("analytics_events").select("event_name, event_props, user_id, created_at");
      if (dateFrom) query = query.gte("created_at", dateFrom);
      const { data } = await query;
      return (data || []) as any[];
    },
  });

  const { data: schools } = useQuery({
    queryKey: ["admin-schools-filter"],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: memberships } = useQuery({
    queryKey: ["admin-memberships-analytics"],
    queryFn: async () => {
      const { data } = await supabase.from("user_school_membership").select("user_id, school_id");
      return data || [];
    },
  });

  const funnelData = useMemo(() => {
    if (!events) return [];
    let filteredEvents = events;

    if (schoolFilter !== "all" && memberships) {
      const schoolUserIds = new Set(memberships.filter(m => m.school_id === schoolFilter).map(m => m.user_id));
      filteredEvents = events.filter(e => schoolUserIds.has(e.user_id));
    }

    return FUNNEL_STEPS.map((step, i) => {
      const viewed = filteredEvents.filter(e => e.event_name === "step_viewed" && (e.event_props as any)?.step === step.key).length;
      const completed = filteredEvents.filter(e => e.event_name === "step_completed" && (e.event_props as any)?.step === step.key).length;
      const prevViewed = i > 0
        ? filteredEvents.filter(e => e.event_name === "step_viewed" && (e.event_props as any)?.step === FUNNEL_STEPS[i - 1].key).length
        : viewed;
      const dropOff = prevViewed > 0 ? Math.round(((prevViewed - viewed) / prevViewed) * 100) : 0;

      return { ...step, viewed, completed, dropOff };
    });
  }, [events, schoolFilter, memberships]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6" /> تحليلات التقدم (Funnel)
      </h1>

      <div className="flex gap-4 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">الفترة الزمنية</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="all">الكل</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">المدرسة</Label>
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدارس</SelectItem>
              {schools?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">مسار الطلاب</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الخطوة</TableHead>
                <TableHead className="text-right">مشاهدات</TableHead>
                <TableHead className="text-right">إكمال</TableHead>
                <TableHead className="text-right">نسبة الإكمال</TableHead>
                <TableHead className="text-right">الانسحاب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelData.map(step => (
                <TableRow key={step.key}>
                  <TableCell className="font-medium">{step.label}</TableCell>
                  <TableCell>{step.viewed}</TableCell>
                  <TableCell>{step.completed}</TableCell>
                  <TableCell>
                    {step.viewed > 0 ? `${Math.round((step.completed / step.viewed) * 100)}%` : "—"}
                  </TableCell>
                  <TableCell>
                    {step.dropOff > 0 ? (
                      <span className="flex items-center gap-1 text-destructive">
                        <TrendingDown className="w-3 h-3" /> {step.dropOff}%
                      </span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            💡 يتم تسجيل الأحداث تلقائيًا عند مشاهدة وإكمال كل خطوة. البيانات ستتراكم مع استخدام الطلاب.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
