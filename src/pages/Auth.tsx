import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import atharLogoLight from "@/assets/athar-logo-light.png";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      await redirectByRole(session.user.id);
    });
  }, []);

  const redirectByRole = async (userId: string) => {
    // If ?next= is provided, go there directly
    if (nextPath) {
      navigate(nextPath, { replace: true });
      return;
    }

    // Check admin role first
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) {
      navigate("/admin", { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.user_type === "parent") {
      navigate("/parent", { replace: true });
    } else if (profile?.user_type === "institution") {
      navigate("/institution", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast({ title: "تم إرسال رابط إعادة التعيين", description: "تحقق من بريدك الإلكتروني" });
        setMode("login");
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "مرحباً بعودتك 👋" });
        await redirectByRole(data.user.id);
      } else {
        const userType = localStorage.getItem("athar_user_type") || "student";
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const profileData: any = {
            user_id: data.user.id,
            full_name: fullName,
            user_type: userType as "student" | "parent" | "institution",
          };
          if (userType === "institution" && schoolName.trim()) {
            profileData.school_name = schoolName.trim();
          }
          await supabase.from("profiles").insert(profileData);
        }

        toast({
          title: "تم إنشاء الحساب",
          description: "تحقق من بريدك الإلكتروني لتأكيد الحساب",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-80 h-80 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card rounded-2xl p-8 shadow-2xl border border-border/50 relative z-10"
      >
        <motion.img
          src={atharLogoLight}
          alt="أثر البداية"
          className="h-16 mx-auto mb-3 object-contain"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {mode === "login" ? "سجّل دخولك للمتابعة" : mode === "signup" ? "أنشئ حسابك الجديد" : "أدخل بريدك لإعادة تعيين كلمة المرور"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                required
                className="h-11"
              />
            </motion.div>
          )}

          {mode === "signup" && (localStorage.getItem("athar_user_type") === "institution") && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
              <Label htmlFor="schoolName">اسم المدرسة</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="مثال: مدرسة الملك فهد"
                className="h-11"
              />
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              className="text-left h-11"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">كلمة المرور</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-link hover:underline hover-underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="text-left h-11"
                required
                minLength={6}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient text-lg h-12 rounded-xl"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
            {loading
              ? "جاري التحميل..."
              : mode === "login"
              ? "تسجيل الدخول"
              : mode === "signup"
              ? "إنشاء حساب"
              : "إرسال رابط إعادة التعيين"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="text-link font-medium hover:underline">
              العودة لتسجيل الدخول
            </button>
          ) : mode === "login" ? (
            <>
              ليس لديك حساب؟{" "}
              <button onClick={() => setMode("signup")} className="text-link font-semibold hover:underline">
                إنشاء حساب جديد
              </button>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{" "}
              <button onClick={() => setMode("login")} className="text-link font-semibold hover:underline">
                تسجيل الدخول
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
