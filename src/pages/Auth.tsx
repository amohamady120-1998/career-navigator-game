import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      await redirectByRole(session.user.id);
    });
  }, []);

  const redirectByRole = async (userId: string) => {
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
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card rounded-xl p-8 shadow-2xl"
      >
        <img src={atharLogoLight} alt="أثر البداية" className="h-16 mx-auto mb-2 object-contain" />
        <p className="text-muted-foreground text-center mb-8">
          {mode === "login" ? "سجّل دخولك للمتابعة" : mode === "signup" ? "أنشئ حسابك الجديد" : "أدخل بريدك لإعادة تعيين كلمة المرور"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
          )}

          {mode === "signup" && (localStorage.getItem("athar_user_type") === "institution") && (
            <div className="space-y-2">
              <Label htmlFor="schoolName">اسم المدرسة</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="مثال: مدرسة الملك فهد"
              />
            </div>
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
              className="text-left"
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
                    className="text-xs text-link hover:underline"
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
                className="text-left"
                required
                minLength={6}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg h-12"
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

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="text-link font-medium hover:underline">
              العودة لتسجيل الدخول
            </button>
          ) : mode === "login" ? (
            <>
              ليس لديك حساب؟{" "}
              <button onClick={() => setMode("signup")} className="text-link font-medium hover:underline">
                إنشاء حساب جديد
              </button>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{" "}
              <button onClick={() => setMode("login")} className="text-link font-medium hover:underline">
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
