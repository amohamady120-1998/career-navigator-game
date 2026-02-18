import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import { Loader2, Activity, GraduationCap, Key, CheckCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "progress" | "activation";
  studentName: string;
  detail: string;
  timestamp: string;
}

export default function InstitutionActivityPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get linked students
      const { data: links } = await supabase
        .from("institution_student_links")
        .select("student_user_id")
        .eq("institution_user_id", session.user.id);

      const studentIds = links?.map(l => l.student_user_id) ?? [];
      if (!studentIds.length) { setActivities([]); setLoading(false); return; }

      // Fetch profiles, recent progress, and recent code activations in parallel
      const [profilesRes, progressRes, stepsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds),
        supabase.from("user_progress").select("user_id, step_id, status, completed_at")
          .in("user_id", studentIds).eq("status", "completed").order("completed_at", { ascending: false }).limit(30),
        supabase.from("journey_steps").select("id, name_ar"),
      ]);

      const nameMap = new Map((profilesRes.data ?? []).map(p => [p.user_id, p.full_name ?? "طالب"]));
      const stepNameMap = new Map((stepsRes.data ?? []).map(s => [s.id, s.name_ar]));

      const items: ActivityItem[] = [];

      (progressRes.data ?? []).forEach(p => {
        if (p.completed_at) {
          items.push({
            id: `prog-${p.user_id}-${p.step_id}`,
            type: "progress",
            studentName: nameMap.get(p.user_id) ?? "طالب",
            detail: `أكمل "${stepNameMap.get(p.step_id) ?? "خطوة"}"`,
            timestamp: p.completed_at,
          });
        }
      });

      // Sort by timestamp desc, limit to 20
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 20));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (activities.length === 0) {
    return <EmptyState icon={Activity} title="لا يوجد نشاط حديث" description="سيظهر هنا النشاط عندما يتقدم الطلاب في رحلتهم" />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">سجل النشاط</h1>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                  a.type === "activation" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-primary/10 text-primary"
                }`}>
                  {a.type === "activation" ? <Key className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{a.studentName}</span>{" "}
                    <span className="text-muted-foreground">{a.detail}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.timestamp).toLocaleDateString("ar-SA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
