import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Link2, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import atharLogoLight from "@/assets/athar-logo-light.png";

export default function ParentActivationConsume() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consuming, setConsuming] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleConsume = async () => {
    if (!token) return;
    setConsuming(true);
    try {
      const { data, error } = await supabase.rpc("consume_parent_activation_token", {
        p_token: token,
      });

      if (error) throw error;

      const res = data as any;
      if (res.success) {
        setResult({ success: true });
        toast({ title: "تم التفعيل بنجاح ✓", description: "تم ربط حسابك بولي أمرك" });
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      } else {
        setResult({ success: false, error: res.error });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message || "حدث خطأ غير متوقع" });
    } finally {
      setConsuming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 relative overflow-hidden" dir="rtl">
      <div className="absolute top-20 right-20 w-80 h-80 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-3">
            <img src={atharLogoLight} alt="أثر" className="h-14 mx-auto object-contain" />
            <CardTitle className="text-xl">تفعيل اشتراك من ولي الأمر</CardTitle>
            <CardDescription>
              {!session
                ? "سجّل دخولك أولاً ثم قم بتفعيل الرابط"
                : result?.success
                ? "تم تفعيل حسابك بنجاح!"
                : "اضغط على الزر أدناه لربط حسابك بولي أمرك"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Not logged in */}
            {!session && (
              <Button
                onClick={() => navigate(`/auth?next=/activate/parent/${token}`)}
                className="w-full btn-gradient h-12 rounded-xl text-lg gap-2"
              >
                <LogIn className="w-5 h-5" />
                تسجيل الدخول للمتابعة
              </Button>
            )}

            {/* Logged in, no result yet */}
            {session && !result && (
              <Button
                onClick={handleConsume}
                disabled={consuming}
                className="w-full btn-gradient h-12 rounded-xl text-lg gap-2"
              >
                {consuming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Link2 className="w-5 h-5" />
                )}
                {consuming ? "جاري التفعيل..." : "تفعيل الآن"}
              </Button>
            )}

            {/* Success */}
            {result?.success && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success))]" />
                </div>
                <p className="text-foreground font-semibold">تم الربط بنجاح!</p>
                <p className="text-muted-foreground text-sm">جاري التحويل للوحة التحكم...</p>
              </motion.div>
            )}

            {/* Error */}
            {result && !result.success && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-foreground font-semibold">لم يتم التفعيل</p>
                <p className="text-muted-foreground text-sm text-center">{result.error}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                    إعادة المحاولة
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/contact")}>
                    تواصل معنا
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
