import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AtharLogo } from "@/components/AtharLogo";
import { RadarChart } from "@/components/RadarChart";

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
        toast({ title: "تم إرسال رابط إعادة التعيين", description: "تحقّق من بريدك الإلكتروني" });
        setMode("login");
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "أهلًا بعودتك 👋" });
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
          description: "تحقّق من بريدك الإلكتروني لتأكيد الحساب",
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

  const title = mode === "login" ? "أهلًا بعودتك" : mode === "signup" ? "أنشئ حسابك" : "استعادة كلمة المرور";
  const lead =
    mode === "login"
      ? "أكمل رحلتك من حيث توقفت."
      : mode === "signup"
      ? "ابدأ رحلتك لاكتشاف تخصصك."
      : "أدخل بريدك الإلكتروني وسنرسل إليك رابط إعادة التعيين.";

  return (
    <div className="grid min-h-screen bg-background text-foreground md:grid-cols-2" dir="rtl">
      {/* ── Navy side ── */}
      <aside className="relative flex flex-col overflow-hidden p-[26px] text-hero-foreground [background:linear-gradient(150deg,hsl(var(--hero-from)),hsl(var(--hero-to)))] md:p-[clamp(30px,4vw,48px)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[12%] h-[70%] w-[60%] [background:radial-gradient(closest-side,hsl(var(--accent)/0.22),transparent_70%)] [inset-inline-start:-15%]" />
          <div className="absolute -bottom-[8%] h-[60%] w-[55%] [background:radial-gradient(closest-side,hsl(var(--link)/0.16),transparent_70%)] [inset-inline-end:-12%]" />
        </div>

        <AtharLogo className="relative" />

        <div className="relative flex flex-1 flex-col justify-center gap-[clamp(18px,2.4vw,24px)] py-6">
          <h2 className="m-0 text-[clamp(1.9rem,3vw,2.7rem)] font-extrabold leading-[1.16]">
            قبل أن تختار،
            <br />
            <span className="text-hero-subtle">اعرف من أنت.</span>
          </h2>

          <div className="relative hidden flex-col items-center py-1.5 md:flex">
            <span
              aria-hidden
              className="absolute left-1/2 top-[46%] h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full [background:radial-gradient(closest-side,hsl(var(--accent)/0.2),transparent_70%)] motion-safe:animate-pulse-soft"
            />
            <RadarChart
              variant="dark"
              values={{ R: 100, I: 100, A: 30, S: 86, E: 71, C: 71 }}
              max={100}
              className="relative w-[min(290px,84%)]"
              ariaLabel="مثال توضيحي لبصمة مهنية على نموذج هولاند"
            />
            <span className="relative mt-2 text-sm font-medium text-hero-subtle">هكذا ستبدو بصمتك المهنية</span>
          </div>

          <div className="flex flex-col gap-[13px]">
            {["تعرّف على ميولك", "اكتشف تخصصاتك الأقرب", "جرّبها بنفسك قبل أن تقرر"].map((t, i) => (
              <div key={t} className="flex items-center gap-[11px] text-[0.96rem] font-medium text-hero-muted">
                <i
                  className={`grid h-[27px] w-[27px] place-items-center rounded-lg text-[0.8rem] font-semibold not-italic ${
                    i === 0 ? "btn-gradient text-accent-foreground" : "bg-hero-foreground/10 text-hero-muted"
                  }`}
                >
                  {["١", "٢", "٣"][i]}
                </i>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-auto hidden flex-wrap items-center justify-between gap-3 text-[0.8rem] text-hero-subtle md:flex">
          <span className="inline-flex items-center gap-[7px] rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 font-semibold text-accent">
            ✦ مبنيّ على نموذج هولاند العلمي
          </span>
          <span>© أثر البداية</span>
        </div>
      </aside>

      {/* ── Form ── */}
      <div className="flex items-center justify-center px-[26px] py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[380px]"
        >
          {mode !== "forgot" && (
            <div className="mb-[22px] flex rounded-xl bg-muted p-[5px]" role="tablist">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-[9px] p-[11px] text-[0.94rem] font-bold transition-colors ${
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {m === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
                </button>
              ))}
            </div>
          )}

          <h2 className="mb-1.5 text-[1.55rem] font-extrabold">{title}</h2>
          <p className="mb-6 text-muted-foreground">{lead}</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-[7px]">
                <Label htmlFor="fullName" className="text-[0.86rem] font-bold">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  required
                  className={fieldClass}
                />
              </motion.div>
            )}

            {mode === "signup" && (localStorage.getItem("athar_user_type") === "institution") && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-[7px]">
                <Label htmlFor="schoolName" className="text-[0.86rem] font-bold">اسم المدرسة</Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="مثال: مدرسة الملك فهد"
                  className={fieldClass}
                />
              </motion.div>
            )}

            <div className="space-y-[7px]">
              <Label htmlFor="email" className="text-[0.86rem] font-bold">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className={`${fieldClass} text-left`}
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-[7px]">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[0.86rem] font-bold">كلمة المرور</Label>
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
                  className={`${fieldClass} text-left`}
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="btn-gradient mt-1.5 h-auto w-full rounded-xl px-[26px] py-3.5 text-base shadow-premium"
            >
              {loading && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
              {loading
                ? "جارٍ التحميل..."
                : mode === "login"
                ? "تسجيل الدخول"
                : mode === "signup"
                ? "إنشاء الحساب"
                : "إرسال رابط إعادة التعيين"}
            </Button>
          </form>

          {mode === "forgot" && (
            <p className="mt-6 text-center text-sm">
              <button onClick={() => setMode("login")} className="font-medium text-link hover:underline">
                العودة إلى تسجيل الدخول
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const fieldClass = "athar-field";

export default Auth;
