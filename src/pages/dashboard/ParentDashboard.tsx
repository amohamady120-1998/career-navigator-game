import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, UserPlus, Loader2, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
import StudentProfileView from "@/components/StudentProfileView";

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
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Link Child Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border-2 border-accent/30 shadow-lg">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <UserPlus className="w-6 h-6" />
              ربط حساب طالب
            </CardTitle>
            <CardDescription>
              أدخل البريد الإلكتروني المسجّل لابنك/ابنتك لمتابعة تقدمهم في الرحلة
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="text-left flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleLinkChild()}
              />
              <Button
                onClick={handleLinkChild}
                disabled={linking || !email.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6"
              >
                {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : "ربط الحساب"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Children Section */}
      {linkedChildren.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            أبنائي ({linkedChildren.length})
          </h2>

          {linkedChildren.map((child, idx) => {
            const steps = childProgress[child.child_user_id] || [];
            const percent = getCompletionPercent(steps);
            const milestones = steps.filter((s) => MILESTONE_SLUGS.includes(s.slug));

            return (
              <motion.div
                key={child.child_user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{child.child_name}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={() => handleViewProfile(child.child_user_id, child.child_name)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        عرض الملف الكامل
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={percent} className="flex-1 h-2.5" />
                      <span className="text-sm font-bold text-primary whitespace-nowrap">
                        {percent}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {milestones.map((step) => (
                        <div
                          key={step.slug}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                            step.completed
                              ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          {step.completed ? (
                            <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))] flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <span
                            className={`text-xs leading-tight ${
                              step.completed ? "font-medium text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.name_ar}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {linkedChildren.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground py-8"
        >
          لم يتم ربط أي حساب طالب بعد. أدخل بريد ابنك/ابنتك أعلاه للبدء.
        </motion.p>
      )}

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
