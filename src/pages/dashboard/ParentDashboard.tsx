import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, UserPlus, Loader2, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
import StudentProfileView from "@/components/StudentProfileView";
import ActivationLinkSection from "@/components/parent/ActivationLinkSection";
import NotificationBell from "@/components/parent/NotificationBell";
import ContactSupportCard from "@/components/shared/ContactSupportCard";
import { HeroBand } from "@/components/HeroBand";
import { btnPrimary, toArabicDigits } from "@/lib/athar";

interface LinkedChild {
  child_user_id: string;
  child_name: string;
}

interface StepProgress {
  name_ar: string;
  slug: string;
  order_index: number;
  completed: boolean;
}

const MILESTONE_SLUGS = ["pre-impact", "holland", "simulation", "report"];

export default function ParentDashboard() {
  const [email, setEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [childProgress, setChildProgress] = useState<Record<string, StepProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Profile view state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileChildId, setProfileChildId] = useState("");
  const [profileChildName, setProfileChildName] = useState("");

  useEffect(() => {
    loadLinkedChildren();
  }, []);

  const loadLinkedChildren = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: links } = await supabase
      .from("parent_child_links")
      .select("child_user_id")
      .eq("parent_user_id", user.id);

    if (!links || links.length === 0) {
      setLinkedChildren([]);
      setLoading(false);
      return;
    }

    const childIds = links.map((l) => l.child_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", childIds);

    const children: LinkedChild[] = links.map((l) => {
      const profile = profiles?.find((p) => p.user_id === l.child_user_id);
      return {
        child_user_id: l.child_user_id,
        child_name: profile?.full_name || "طالب",
      };
    });

    setLinkedChildren(children);

    const { data: steps } = await supabase
      .from("journey_steps")
      .select("id, name_ar, order_index, slug")
      .order("order_index");

    if (steps) {
      const progressMap: Record<string, StepProgress[]> = {};
      for (const child of children) {
        const { data: userProg } = await supabase
          .from("user_progress")
          .select("step_id, status")
          .eq("user_id", child.child_user_id);

        progressMap[child.child_user_id] = steps.map((step) => {
          const prog = userProg?.find((p) => p.step_id === step.id);
          return {
            name_ar: step.name_ar,
            slug: step.slug,
            order_index: step.order_index,
            completed: prog?.status === "completed",
          };
        });
      }
      setChildProgress(progressMap);
    }

    setLoading(false);
  };

  const handleLinkChild = async () => {
    if (!email.trim()) return;
    setLinking(true);

    try {
      const { data, error } = await supabase.rpc("link_student_by_email", {
        student_email: email.trim(),
      });

      if (error) {
        toast({
          title: "خطأ",
          description: error.message.includes("Only parents")
            ? "هذه الخدمة متاحة لأولياء الأمور فقط"
            : "حدث خطأ أثناء الربط",
          variant: "destructive",
        });
        return;
      }

      if (data === false) {
        toast({
          title: "لم يتم العثور",
          description: "لم يتم العثور على حساب طالب بهذا البريد الإلكتروني",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "تم ربط الحساب بنجاح ✓" });
      setEmail("");
      await loadLinkedChildren();
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const handleViewProfile = (childId: string, childName: string) => {
    setProfileChildId(childId);
    setProfileChildName(childName);
    setProfileOpen(true);
  };

  const getCompletionPercent = (steps: StepProgress[]) => {
    if (steps.length === 0) return 0;
    const completed = steps.filter((s) => s.completed).length;
    return Math.round((completed / steps.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const percents = linkedChildren.map((c) => getCompletionPercent(childProgress[c.child_user_id] || []));
  const completedCount = percents.filter((p) => p >= 100).length;
  const avgPercent = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0;

  return (
    <div className="athar-page max-w-[960px] space-y-4" dir="rtl">
      <HeroBand
        eyebrow="بوابة وليّ الأمر"
        title="رحلة أبنائك… تتابعها دون أن تتدخّل"
        description="تطمئن على تقدّمهم ونتائجهم وتقاريرهم، والقرار يبقى قرارهم، بثقة تبنيها معهم."
        className="mb-0"
      >
        <div className="flex justify-end [&_button]:text-hero-foreground [&_button:hover]:bg-hero-foreground/10">
          <NotificationBell />
        </div>
      </HeroBand>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Kpi value={toArabicDigits(linkedChildren.length)} label="أبناء مرتبطون" />
        <Kpi value={toArabicDigits(completedCount)} label="رحلات مكتملة" tone="success" />
        <Kpi value={`${toArabicDigits(avgPercent)}٪`} label="متوسط التقدّم" tone="accent" />
        <Kpi value={toArabicDigits(Math.max(linkedChildren.length - completedCount, 0))} label="رحلات جارية" />
      </div>

      {/* Activation Link Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <ActivationLinkSection />
      </motion.div>

      {/* Link Child Card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="athar-card"
      >
        <h3 className="mb-1 flex items-center gap-2 text-[1.08rem] font-extrabold">
          <UserPlus className="h-5 w-5 text-accent" />
          ربط حساب طالب
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          أدخل البريد الإلكتروني المسجّل لابنك/ابنتك لمتابعة تقدمهم في الرحلة
        </p>
        <div className="flex flex-wrap gap-3">
          <Input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className="athar-field min-w-[220px] flex-1 text-left"
            onKeyDown={(e) => e.key === "Enter" && handleLinkChild()}
          />
          <Button onClick={handleLinkChild} disabled={linking || !email.trim()} className={btnPrimary}>
            {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : "ربط الحساب"}
          </Button>
        </div>
      </motion.section>

      {/* Children Section */}
      {linkedChildren.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2.5 pt-2 text-[1.05rem] font-extrabold after:h-px after:flex-1 after:bg-border after:content-['']">
            <Users className="h-5 w-5 text-accent" />
            أبنائي ({toArabicDigits(linkedChildren.length)})
          </h2>

          {linkedChildren.map((child, idx) => {
            const steps = childProgress[child.child_user_id] || [];
            const percent = getCompletionPercent(steps);
            const milestones = steps.filter((s) => MILESTONE_SLUGS.includes(s.slug));

            return (
              <motion.section
                key={child.child_user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="athar-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[1.08rem] font-extrabold">{child.child_name}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-[10px] font-bold"
                    onClick={() => handleViewProfile(child.child_user_id, child.child_name)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    عرض الملف الكامل
                  </Button>
                </div>
                <div className="mb-5 mt-3 flex items-center gap-3">
                  <div className="athar-track flex-1">
                    <i style={{ width: `${percent}%` }} />
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-[hsl(var(--gradient-end))]">
                    {toArabicDigits(percent)}٪
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {milestones.map((step) => (
                    <div
                      key={step.slug}
                      className={`flex items-center gap-3 text-[0.95rem] font-semibold ${step.completed ? "" : "text-muted-foreground"}`}
                    >
                      <span
                        className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-lg ${
                          step.completed ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Clock className="h-3.5 w-3.5" />}
                      </span>
                      {step.name_ar}
                      <small className={`ms-auto text-[0.76rem] font-bold ${step.completed ? "text-success" : "text-muted-foreground"}`}>
                        {step.completed ? "مكتمل" : "لم يكتمل"}
                      </small>
                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {linkedChildren.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="athar-card py-8 text-center text-muted-foreground"
        >
          لم يتم ربط أي حساب طالب بعد. أدخل بريد ابنك/ابنتك أعلاه للبدء.
        </motion.p>
      )}

      {/* Contact Support */}
      <ContactSupportCard />

      {/* Student Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>ملف الطالب — {profileChildName}</DialogTitle>
          </DialogHeader>
          {profileChildId && (
            <StudentProfileView studentId={profileChildId} studentName={profileChildName} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ value, label, tone }: { value: React.ReactNode; label: string; tone?: "success" | "accent" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-[18px]">
      <div
        className={`text-[1.55rem] font-black leading-none ${
          tone === "success" ? "text-success" : tone === "accent" ? "text-[hsl(var(--gradient-end))]" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-[7px] text-[0.82rem] font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}
