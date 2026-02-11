import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ConsentGateProps {
  requiredStep?: string;
  children: React.ReactNode;
}

export function ConsentGate({ requiredStep = "pre-impact", children }: ConsentGateProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: userConsent, isLoading } = useQuery({
    queryKey: ["user-consent"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data } = await supabase
        .from("user_consents")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      return data;
    },
  });

  useEffect(() => {
    if (!isLoading && !userConsent) {
      setOpen(true);
    }
  }, [isLoading, userConsent]);

  const handleConsent = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const { error } = await supabase.from("user_consents").upsert({
        user_id: session.user.id,
        consent_version: "v1",
        consented_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["user-consent"] });
      toast.success("تم قبول السياسة والشروط بنجاح!");
      setOpen(false);
      setAgreed(false);
    } catch (error) {
      console.error("Consent error:", error);
      toast.error("حدث خطأ. يرجى المحاولة مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => {/* prevent closing without consent */}}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl">قبل ما نبدأ...</DialogTitle>
            <DialogDescription>
              نحتاج إلى موافقتك على سياسة الخصوصية والشروط
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* What we collect */}
            <Card className="p-5 bg-muted/50 border-border/50">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">البيانات التي نجمعها:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ بيانات الحساب (الاسم والبريد)</li>
                    <li>✓ إجابات الاختبارات والتقييمات</li>
                    <li>✓ تقدمك في الرحلة</li>
                    <li>✓ طلبات الاستشارة</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Why we need it */}
            <Card className="p-5 bg-muted/50 border-border/50">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">لماذا نحتاجها:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ إنشاء تقاريرك الشخصية</li>
                    <li>✓ تتبع تقدمك</li>
                    <li>✓ تحسين المحتوى</li>
                    <li>✓ دعم احتياجاتك</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Sharing note */}
            <Card className="p-4 bg-accent/10 border border-accent/20">
              <p className="text-sm text-foreground">
                <strong>الحماية:</strong> بيانات خاصة بك. روابط المشاركة اختيارية وقابلة للإلغاء في أي وقت.
              </p>
            </Card>

            {/* Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                id="consent-agree"
              />
              <label
                htmlFor="consent-agree"
                className="text-sm cursor-pointer flex-1 pt-0.5"
              >
                أوافق على{" "}
                <button
                  onClick={() => navigate("/privacy")}
                  className="text-primary hover:underline"
                >
                  سياسة الخصوصية
                </button>
                {" "}و{" "}
                <button
                  onClick={() => navigate("/terms")}
                  className="text-primary hover:underline"
                >
                  الشروط والأحكام
                </button>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleConsent}
                disabled={!agreed || loading}
                className="flex-1"
              >
                {loading ? "جاري المعالجة..." : "متابعة"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              يمكنك مراجعة السياسات في أي وقت من صفحة الإعدادات
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>

      {children}
    </>
  );
}
