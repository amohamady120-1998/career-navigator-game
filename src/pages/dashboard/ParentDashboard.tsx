import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Lock, UserPlus, Loader2 } from "lucide-react";

interface LinkedChild {
  child_user_id: string;
  child_name: string;
}

interface StepProgress {
  name_ar: string;
  order_index: number;
  completed: boolean;
}

export default function ParentDashboard() {
  const [email, setEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [progress, setProgress] = useState<StepProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const { toast } = useToast();

  // Load linked children on mount
  useEffect(() => {
    loadLinkedChildren();
  }, []);

  // Load progress when child is selected
  useEffect(() => {
    if (selectedChild) {
      loadChildProgress(selectedChild);
    }
  }, [selectedChild]);

  const loadLinkedChildren = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: links } = await supabase
      .from("parent_child_links")
      .select("child_user_id")
      .eq("parent_user_id", user.id);

    if (!links || links.length === 0) {
      setLinkedChildren([]);
      return;
    }

    // Get child names from profiles
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
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].child_user_id);
    }
  };

  const loadChildProgress = async (childId: string) => {
    setLoadingProgress(true);

    // Get all journey steps
    const { data: steps } = await supabase
      .from("journey_steps")
      .select("id, name_ar, order_index")
      .order("order_index");

    // Get child's progress
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("step_id, status, completed_at")
      .eq("user_id", childId);

    if (steps) {
      const result: StepProgress[] = steps.map((step) => {
        const prog = userProgress?.find((p) => p.step_id === step.id);
        return {
          name_ar: step.name_ar,
          order_index: step.order_index,
          completed: prog?.status === "completed",
        };
      });
      setProgress(result);
    }

    setLoadingProgress(false);
  };

  const handleLinkChild = async () => {
    if (!email.trim()) return;
    setLinking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("lookup-child", {
        body: { email: email.trim() },
      });

      if (response.error || response.data?.error) {
        toast({
          title: "خطأ",
          description: response.data?.error || "حدث خطأ أثناء البحث",
          variant: "destructive",
        });
        return;
      }

      const { child_user_id } = response.data;

      // Check if already linked
      const existing = linkedChildren.find((c) => c.child_user_id === child_user_id);
      if (existing) {
        toast({ title: "تنبيه", description: "هذا الطالب مرتبط بالفعل" });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: insertError } = await supabase
        .from("parent_child_links")
        .insert({ parent_user_id: user.id, child_user_id });

      if (insertError) {
        toast({
          title: "خطأ",
          description: "فشل في ربط الطالب",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "تم الربط بنجاح ✓" });
      setEmail("");
      await loadLinkedChildren();
      setSelectedChild(child_user_id);
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Link Child Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5" />
            ربط حساب طالب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="البريد الإلكتروني للطالب"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              className="text-left flex-1"
            />
            <Button onClick={handleLinkChild} disabled={linking || !email.trim()}>
              {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : "ربط"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Child Tabs (if multiple) */}
      {linkedChildren.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {linkedChildren.map((child) => (
            <Button
              key={child.child_user_id}
              variant={selectedChild === child.child_user_id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChild(child.child_user_id)}
            >
              {child.child_name}
            </Button>
          ))}
        </div>
      )}

      {/* Progress Card */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              تقدم الرحلة — {linkedChildren.find((c) => c.child_user_id === selectedChild)?.child_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProgress ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : progress.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">لم يبدأ الطالب الرحلة بعد</p>
            ) : (
              <div className="space-y-3">
                {progress.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border"
                  >
                    {step.completed ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className={step.completed ? "font-medium" : "text-muted-foreground"}>
                      {step.name_ar}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {linkedChildren.length === 0 && (
        <p className="text-center text-muted-foreground">
          أدخل البريد الإلكتروني لابنك/ابنتك أعلاه لربط حسابهم ومتابعة تقدمهم
        </p>
      )}
    </div>
  );
}
