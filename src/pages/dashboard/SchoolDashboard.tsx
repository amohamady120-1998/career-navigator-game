import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, School, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SchoolAnalytics from "@/components/SchoolAnalytics";

export default function SchoolDashboard() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Derive school_id securely from school_admins table
      const { data: schoolAdmin } = await supabase
        .from("school_admins")
        .select("school_id, role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (schoolAdmin) {
        setSchoolId(schoolAdmin.school_id);
      } else {
        // Fallback: check user_school_membership (for backward compat)
        const { data: membership } = await supabase
          .from("user_school_membership")
          .select("school_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (membership) {
          setSchoolId(membership.school_id);
        } else {
          setAccessDenied(true);
        }
      }
      setLoading(false);
    })();
  }, [navigate]);

  const { data: school } = useQuery({
    queryKey: ["school-info", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("*").eq("id", schoolId!).single();
      return data;
    },
    enabled: !!schoolId,
  });

  const { data: orders } = useQuery({
    queryKey: ["school-orders-dash", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("school_orders").select("*").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: students } = useQuery({
    queryKey: ["school-students", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_school_membership")
        .select("user_id, activated_at, activated_by_code")
        .eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const studentIds = students?.map(s => s.user_id) || [];

  const { data: rawProgress } = useQuery({
    queryKey: ["school-progress-raw", schoolId, studentIds.length],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data } = await supabase
        .from("user_progress")
        .select("user_id, step_id, status")
        .in("user_id", studentIds);
      return data || [];
    },
    enabled: !!schoolId && studentIds.length > 0,
  });

  const { data: journeySteps } = useQuery({
    queryKey: ["journey-steps-analytics"],
    queryFn: async () => {
      const { data } = await supabase.from("journey_steps").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: impactRaw } = useQuery({
    queryKey: ["school-impact-raw", schoolId, studentIds.length],
    queryFn: async () => {
      if (!studentIds.length) return [];
      const { data } = await supabase
        .from("impact_assessments")
        .select("user_id, assessment_type, score_json")
        .in("user_id", studentIds);
      return data || [];
    },
    enabled: !!schoolId && studentIds.length > 0,
  });

  const progressData = (() => {
    if (!journeySteps || !rawProgress) return [];
    return journeySteps.map(step => {
      const matching = rawProgress.filter(p => p.step_id === step.id);
      return {
        step_slug: step.slug,
        step_name: step.name_ar,
        total_students: studentIds.length,
        completed_count: matching.filter(p => p.status === "completed").length,
        in_progress_count: matching.filter(p => p.status === "in_progress").length,
      };
    });
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (accessDenied) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center" dir="rtl">
        <Card>
          <CardContent className="py-12">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">ليس لديك صلاحية</p>
            <p className="text-muted-foreground mb-4">لم يتم ربط حسابك بمدرسة بعد. تواصل مع المشرف لتعيينك.</p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              العودة للوحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <School className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{school?.name || "لوحة المدرسة"}</h1>
          <p className="text-sm text-muted-foreground">{school?.city}</p>
        </div>
      </div>

      <SchoolAnalytics
        schoolName={school?.name || "school"}
        totalSeats={totalSeats}
        usedSeats={usedSeats}
        students={students || []}
        progressData={progressData}
        impactData={impactData}
        studentProgress={studentProgress}
      />
    </div>
  );
}
