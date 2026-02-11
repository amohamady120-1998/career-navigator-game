import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, School, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SchoolAnalytics from "@/components/SchoolAnalytics";

export default function AdminSchoolReports() {
  const navigate = useNavigate();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  const { data: schools, isLoading: loadingSchools } = useQuery({
    queryKey: ["admin-all-schools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-school-orders-report", selectedSchoolId],
    queryFn: async () => {
      const { data } = await supabase.from("school_orders").select("*").eq("school_id", selectedSchoolId);
      return data || [];
    },
    enabled: !!selectedSchoolId,
  });

  const { data: students } = useQuery({
    queryKey: ["admin-school-students-report", selectedSchoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_school_membership")
        .select("user_id, activated_at, activated_by_code")
        .eq("school_id", selectedSchoolId);
      return data || [];
    },
    enabled: !!selectedSchoolId,
  });

  const studentIds = students?.map(s => s.user_id) || [];

  const { data: rawProgress } = useQuery({
    queryKey: ["admin-school-progress-report", selectedSchoolId, studentIds.length],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data } = await supabase
        .from("user_progress")
        .select("user_id, step_id, status")
        .in("user_id", studentIds);
      return data || [];
    },
    enabled: !!selectedSchoolId && studentIds.length > 0,
  });

  const { data: journeySteps } = useQuery({
    queryKey: ["journey-steps-admin-report"],
    queryFn: async () => {
      const { data } = await supabase.from("journey_steps").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: impactRaw } = useQuery({
    queryKey: ["admin-school-impact-report", selectedSchoolId, studentIds.length],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data } = await supabase
        .from("impact_assessments")
        .select("user_id, assessment_type, score_json")
        .in("user_id", studentIds);
      return data || [];
    },
    enabled: !!selectedSchoolId && studentIds.length > 0,
  });

  const progressData = (() => {
    if (!journeySteps || !rawProgress) return [];
    return journeySteps.map(step => ({
      step_slug: step.slug,
      step_name: step.name_ar,
      total_students: studentIds.length,
      completed_count: rawProgress.filter(p => p.step_id === step.id && p.status === "completed").length,
      in_progress_count: rawProgress.filter(p => p.step_id === step.id && p.status === "in_progress").length,
    }));
  })();

  const impactData = (() => {
    if (!impactRaw) return null;
    const pre = impactRaw.filter(i => i.assessment_type === "pre");
    const post = impactRaw.filter(i => i.assessment_type === "post");
    const preScores = pre.filter(i => i.score_json && (i.score_json as any)?.percentage != null).map(i => (i.score_json as any).percentage);
    const postScores = post.filter(i => i.score_json && (i.score_json as any)?.percentage != null).map(i => (i.score_json as any).percentage);
    return {
      count_pre_completed: pre.length,
      count_post_completed: post.length,
      avg_pre_score: preScores.length ? preScores.reduce((a: number, b: number) => a + b, 0) / preScores.length : null,
      avg_post_score: postScores.length ? postScores.reduce((a: number, b: number) => a + b, 0) / postScores.length : null,
    };
  })();

  const studentProgress = (() => {
    if (!rawProgress || !journeySteps) return undefined;
    const stepMap = new Map(journeySteps.map(s => [s.id, s.slug]));
    const result: Record<string, string[]> = {};
    rawProgress.forEach(p => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug) {
          if (!result[p.user_id]) result[p.user_id] = [];
          result[p.user_id].push(slug);
        }
      }
    });
    return result;
  })();

  const totalSeats = orders?.reduce((s, o) => s + o.seats_total, 0) || 0;
  const usedSeats = orders?.reduce((s, o) => s + o.seats_used, 0) || 0;
  const selectedSchool = schools?.find(s => s.id === selectedSchoolId);

  if (loadingSchools) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <School className="w-6 h-6" /> تقارير المدارس
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/schools")}>
            <ExternalLink className="w-3 h-3 ml-1" /> إدارة المدارس
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/school-orders")}>
            <ExternalLink className="w-3 h-3 ml-1" /> الطلبات
          </Button>
        </div>
      </div>

      <div className="max-w-sm">
        <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
          <SelectTrigger>
            <SelectValue placeholder="اختر مدرسة لعرض تقريرها" />
          </SelectTrigger>
          <SelectContent>
            {schools?.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSchoolId && selectedSchool && (
        <SchoolAnalytics
          schoolName={selectedSchool.name}
          totalSeats={totalSeats}
          usedSeats={usedSeats}
          students={students || []}
          progressData={progressData}
          impactData={impactData}
          studentProgress={studentProgress}
        />
      )}

      {!selectedSchoolId && (
        <div className="text-center py-16 text-muted-foreground">
          <School className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>اختر مدرسة من القائمة أعلاه لعرض التقرير التفصيلي</p>
        </div>
      )}
    </div>
  );
}
